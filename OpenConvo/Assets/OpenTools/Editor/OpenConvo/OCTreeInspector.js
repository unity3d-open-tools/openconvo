#pragma strict

import System.Collections.Generic;

@CustomEditor ( OCTree )
public class OCTreeInspector extends Editor {
	private class NodeConnection {
		public var container : NodeContainer;
		public var output : int;
		
		function NodeConnection ( container : NodeContainer, output : int ) {
			this.container = container;
			this.output = output;
		}	
	}

	private class NodeContainer {
		public var node : OCNode;
		public var input : Rect = new Rect();
		public var outputs : Rect[] = new Rect[0];
		public var connections : Rect[] = new Rect[0];
		public var rect : Rect;

		public function SetOutput ( i : int, rect : Rect ) {
			if ( i < outputs.Length ) {
				outputs[i] = rect;

			} else {
				var tmpOut : List.< Rect > = new List.< Rect > ( outputs );

				tmpOut.Add ( rect );

				outputs = tmpOut.ToArray ();
			}
		}
	}

	private var editRoot : int = 0;
	private var showingEditor : boolean = false;
	private var scrollPos : Vector2;
	private var nodeTypeStrings : String[] = [ "Speak", "Event", "Jump", "SetFlag", "GetFlag" ];
	private var nodeContainers : Dictionary.< int, NodeContainer > = new Dictionary.< int, NodeContainer > ();
	private var connecting : NodeConnection;

	public static function SavePrefab ( target : UnityEngine.Object ) {
		var selectedGameObject : GameObject;
		var selectedPrefabType : PrefabType;
		var parentGameObject : GameObject;
		var prefabParent : UnityEngine.Object;
		     
		selectedGameObject = Selection.gameObjects[0];
		selectedPrefabType = PrefabUtility.GetPrefabType(selectedGameObject);
		parentGameObject = selectedGameObject.transform.root.gameObject;
		prefabParent = PrefabUtility.GetPrefabParent(selectedGameObject);
		     
		EditorUtility.SetDirty(target);
		     
		if (selectedPrefabType == PrefabType.PrefabInstance) {
			PrefabUtility.ReplacePrefab(parentGameObject, prefabParent,
			ReplacePrefabOptions.ConnectToPrefab);
	    	}
	}

    	private function DrawBezierCurve ( start : Vector2, end : Vector2 ) {
		var startPos : Vector3 = new Vector3(start.x, start.y, 0);
		var endPos : Vector3 = new Vector3(end.x, end.y, 0);
		var startTan : Vector3 = startPos + Vector3.up * 50;
		var endTan : Vector3 = endPos - Vector3.up * 50;

		Handles.DrawBezier(startPos, endPos, startTan, endTan, new Color ( 1, 1, 1, 0.5 ), null, 1);
    	}
	
	private function GetSpeakerStrings ( tree : OCTree ) : String[] {
		var result : String[] = new String [tree.speakers.Length];

		for ( var i : int = 0; i < result.Length; i++ ) {
			var go : GameObject = tree.speakers[i];
			
			result[i] = ( go == null ) ? i.ToString () : go.name;
		}

		return result;
	}

	private function GetNodeTypeIndex ( type : String, types : String[] ) {
		for ( var i : int = 0; i < types.Length; i++ ) {
			if ( type == "OC" + types[i] ) {
				return i;
			}
		}

		return -1;
	}
	
	private function NewNodeFromType ( type : String ) : OCNode {
		var newNode : OCNode;

		switch ( type ) {
			case "Speak":
				newNode = new OCSpeak ();
				break;
			
			case "Event":
				newNode = new OCEvent ();
				break;
			
			case "Jump":
				newNode = new OCJump ();
				break;
			
			case "SetFlag":
				newNode = new OCSetFlag ();
				break;
			
			case "GetFlag":
				newNode = new OCGetFlag ();
				break;
		}

		return newNode;
	}

	function Update () {
		Repaint ();
	}

	override function OnInspectorGUI () {
		var tree : OCTree = target as OCTree;

		var rootNodeStrings : String[] = new String[tree.rootNodes.Length];
		for ( var i : int = 0; i < rootNodeStrings.Length; i++ ) {
			rootNodeStrings[i] = i.ToString();
		}

		tree.eventHandler = EditorGUILayout.ObjectField ( "Event handler", tree.eventHandler, typeof ( GameObject ), true ) as GameObject;
		tree.currentRoot = EditorGUILayout.Popup ( "Current root node", tree.currentRoot, rootNodeStrings );	
	
		EditorGUILayout.Space ();

		EditorGUILayout.LabelField ( "Speakers", EditorStyles.boldLabel );

		for ( i = 0; i < tree.speakers.Length; i++ ) {
			EditorGUILayout.BeginHorizontal ();
			tree.speakers[i] = EditorGUILayout.ObjectField ( i.ToString(), tree.speakers[i], typeof ( GameObject ), true ) as GameObject;
			
			GUI.backgroundColor = Color.red;
			if ( GUILayout.Button ( "x", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
				var tmpSpk : List.< GameObject > = new List.< GameObject > ( tree.speakers );

				tmpSpk.RemoveAt ( i );

				tree.speakers = tmpSpk.ToArray ();
			}
			GUI.backgroundColor = Color.white;
			
			EditorGUILayout.EndHorizontal ();
		}
		
		GUI.backgroundColor = Color.green;
		if ( GUILayout.Button ( "+", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
			tmpSpk = new List.< GameObject > ( tree.speakers );

			tmpSpk.Add ( null );

			tree.speakers = tmpSpk.ToArray ();
		}
		GUI.backgroundColor = Color.white;

		EditorGUILayout.Space ();

		showingEditor = EditorGUILayout.Foldout ( showingEditor, "Editor" );

		if ( showingEditor ) {
			// Select root
			EditorGUILayout.BeginHorizontal ();
			
			EditorGUILayout.LabelField ( "Root", EditorStyles.boldLabel, GUILayout.Width ( 80 ) );
			editRoot = EditorGUILayout.Popup ( editRoot, rootNodeStrings, GUILayout.Width ( 200 ) );
		
			if ( tree.rootNodes[editRoot] == null ) {
				tree.rootNodes[editRoot] = new OCRootNode ();
			}
			var root : OCRootNode = tree.rootNodes[editRoot];	

			EditorGUILayout.EndHorizontal ();
			
			// Set tags
			EditorGUILayout.BeginHorizontal ();
			
			EditorGUILayout.LabelField ( "Tags", EditorStyles.boldLabel, GUILayout.Width ( 80 ) );
			
			EditorGUILayout.BeginVertical ();
			
			for ( i = 0; i < root.tags.Length; i++ ) {
				EditorGUILayout.BeginHorizontal ();
				root.tags[i] = EditorGUILayout.TextField ( root.tags[i], GUILayout.Width ( 200 ) );
				GUI.backgroundColor = Color.red;
				if ( GUILayout.Button ( "x", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
					root.RemoveTag ( root.tags[i] );
				}
				GUI.backgroundColor = Color.white;
				EditorGUILayout.EndHorizontal ();
			}
			
			GUI.backgroundColor = Color.green;
			if ( GUILayout.Button ( "+", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
				root.SetTag ( "newTag" );
			}
			GUI.backgroundColor = Color.white;
			
			EditorGUILayout.EndVertical ();

			EditorGUILayout.EndHorizontal ();
			
			EditorGUILayout.Space ();

			// Nodes
			EditorGUILayout.BeginHorizontal ();
			EditorGUILayout.LabelField ( "Nodes", EditorStyles.boldLabel, GUILayout.Width ( 80 ) );
			GUI.backgroundColor = Color.red;
			if ( GUILayout.Button ( "Clear", GUILayout.Width ( 100 ) ) ) {
				root.ClearNodes ();
				nodeContainers.Clear ();
			}
			GUI.backgroundColor = Color.white;
			EditorGUILayout.EndHorizontal ();

			scrollPos = EditorGUILayout.BeginScrollView ( scrollPos );

			if ( root.childNodes.Length < 1 ) {
				GUI.backgroundColor = Color.green;
				if ( GUI.Button ( new Rect ( 20, 20, 20, 20 ), "+" ) ) {
					root.AddFirstNode ();
				}
				GUI.backgroundColor = Color.white;

			} else {	
				for ( i = 0; i < root.childNodes.Length; i++ ) {
					var node : OCNode = root.childNodes[i];
					if ( node == null ) { continue; }

					if ( !nodeContainers.ContainsKey ( node.id ) ) {
						nodeContainers[node.id] = new NodeContainer ();

					} else {
						// Set container data
						var container : NodeContainer = nodeContainers[node.id];
						container.node = node;
						container.input = new Rect ( container.rect.x - 7, container.rect.y - 7, 14, 14 );

						// Draw container						
						GUI.Box ( container.rect, "" );
						
						// ^ Input
						if ( GUI.Button ( container.input, "" ) ) {
							if ( connecting && connecting.container && connecting.container.node.id != node.id ) {
								connecting.container.node.connectedTo[connecting.output] = node.id;
								connecting = null;
							}
						}

						// ^ Type
						var typeIndex : int = GetNodeTypeIndex ( node.GetType().ToString(), nodeTypeStrings );
						var newTypeIndex : int = 0;
						var typeRect : Rect = new Rect ( container.rect.x + 20, container.rect.y - 7, 100, 20 );

						newTypeIndex = EditorGUI.Popup ( typeRect, typeIndex, nodeTypeStrings );

						// ^ Begin clipping
						GUI.BeginGroup ( container.rect );
						GUILayout.BeginArea ( new Rect ( 10, 20, container.rect.width - 20, container.rect.width - 20 ) );

						var speak : OCSpeak = node as OCSpeak;

						if ( speak ) {
							container.rect = new Rect ( 20, 20, speak.lines.length * 240, 80 );

							EditorGUILayout.BeginHorizontal ();
							EditorGUILayout.LabelField ( "Speaker", GUILayout.Width ( 60 ) );
							speak.speaker = EditorGUILayout.Popup ( speak.speaker, GetSpeakerStrings ( tree ), GUILayout.Width ( 120 ) );
							EditorGUILayout.EndHorizontal ();
					
							EditorGUILayout.Space ();

							container.connections = new Rect [ speak.lines.Length ];
							
							var tmpConnect : List.< int > = new List.< int > ();
							
							for ( var c : int = 0; c < container.connections.Length; c++ ) {
								if ( c < speak.connectedTo.Length ) {
									tmpConnect.Add ( speak.connectedTo[c] );
								} else {
									tmpConnect.Add ( 0 );
								}
							}

							speak.connectedTo = tmpConnect.ToArray();

							EditorGUILayout.BeginHorizontal ();

							for ( var l : int = 0; l < speak.lines.Length; l++ ) {
								EditorGUILayout.BeginVertical ();
								
								EditorGUILayout.BeginHorizontal ();
							
								speak.lines[l] = EditorGUILayout.TextField ( speak.lines[l] );
								
								if ( l > 0 ) {
									GUI.backgroundColor = Color.red;
									if ( GUILayout.Button ( "x", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
										var tmpLines : List.<String> = new List.<String>(speak.lines);
										tmpLines.RemoveAt ( l );
										speak.lines = tmpLines.ToArray ();
									}
									GUI.backgroundColor = Color.white;
								} else {
									GUILayout.Space ( 28 );
								}
								
								EditorGUILayout.EndHorizontal ();

								container.SetOutput( l, GUILayoutUtility.GetLastRect() );
								
								EditorGUILayout.EndVertical ();
							}
									
							GUI.backgroundColor = Color.green;
							if ( GUILayout.Button ( "+", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
								tmpLines = new List.<String>(speak.lines);
								tmpLines.Add ( "" );
								speak.lines = tmpLines.ToArray ();
							}
							GUI.backgroundColor = Color.white;
							
							EditorGUILayout.EndHorizontal ();
							
						}
						
						GUILayout.EndArea ();
						GUI.EndGroup ();

						// ^ Outputs
						for ( var o : int = 0; o < container.outputs.Length; o++ ) {
							container.outputs[o] = new Rect ( container.rect.x + 10 + container.outputs[o].x, container.rect.yMax - 7, 14, 14 );
							if ( GUI.Button ( container.outputs[o], "" ) ) {
								connecting = new NodeConnection ( container, o );
							}

							var cNode : OCNode = root.GetNode(node.connectedTo[o]);

							if ( cNode ) {
								var cContainer : NodeContainer = nodeContainers[cNode.id];
								if ( !cContainer ) { continue; }

								DrawBezierCurve ( container.outputs[o].center, cContainer.input.center );
							
							} else {
								var newRect : Rect = container.outputs[o];
								newRect.y += 20;

								if ( GUI.Button ( newRect, "" ) ) {
									var newNode : OCNode = root.AddNode ();
									node.connectedTo[o] = newNode.id;
								}

							}
						}
					}
				}

			}
			
			// Draw connection bezier
			if ( connecting && connecting.container == container ) {
				DrawBezierCurve ( container.outputs[connecting.output].center, Event.current.mousePosition );
			}
		
			if ( Event.current.type == EventType.MouseDown ) {
				connecting = null;
			}

			EditorGUILayout.EndScrollView ();
		
			EditorUtility.SetDirty ( target );
			Repaint ();
		}
	}
}
