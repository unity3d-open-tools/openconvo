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
		public var inputRect : Rect;
		public var input : NodeContainer;
		public var outputRects : Rect[] = new Rect[0];
		public var outputs : NodeContainer[] = new NodeContainer[0];
		public var rect : Rect;

		function NodeContainer ( node : OCNode ) {
			this.node = node;
		}

		public function SetOutputAmount ( n : int ) {
			outputs = new NodeContainer[n];
			outputRects = new Rect[n];
		}
	}

	private var editRoot : int = 0;
	private var showingEditor : boolean = false;
	private var scrollPos : Vector2;
	private var nodeTypeStrings : String[] = [ "Speak", "Event", "Jump", "SetFlag", "GetFlag" ];
	private var nodeContainers : Dictionary.< int, NodeContainer > = new Dictionary.< int, NodeContainer > ();
	private var connecting : NodeConnection;
	private var nodeDistance : float = 200;
	private var viewRect : Rect;

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

	override function OnInspectorGUI () {
		var tree : OCTree = target as OCTree;

		var rootNodeStrings : String[] = new String[tree.rootNodes.Length];
		for ( var i : int = 0; i < rootNodeStrings.Length; i++ ) {
			rootNodeStrings[i] = i.ToString();
		}
		
		if ( !showingEditor ) {
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
		}

		showingEditor = EditorGUILayout.Foldout ( showingEditor, "Editor" );

		if ( showingEditor ) {
			var lblStyle : GUIStyle = new GUIStyle ( GUI.skin.label );
			lblStyle.alignment = TextAnchor.MiddleCenter;
			lblStyle.padding.left = 0;
			
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

			EditorGUILayout.LabelField ( "Nodes: " + root.childNodes.Length + ", Containers: " + nodeContainers.Count );

			EditorGUILayout.EndHorizontal ();

			GUILayout.FlexibleSpace();

			var scrollRect : Rect = GUILayoutUtility.GetLastRect ();
			scrollRect.width = Screen.width;

			scrollPos = GUI.BeginScrollView ( scrollRect, scrollPos, viewRect );

			if ( root.childNodes.Length < 1 ) {
				GUI.backgroundColor = Color.green;
				if ( GUI.Button ( new Rect ( 20, 20, 20, 20 ), "+" ) ) {
					root.AddFirstNode ();
				}
				viewRect.xMax = 100;
				viewRect.yMax = 80;
				GUI.backgroundColor = Color.white;

			} else {	
				for ( i = 0; i < root.childNodes.Length; i++ ) {
					var node : OCNode = root.childNodes[i];
					if ( node == null ) { continue; }

					if ( !nodeContainers.ContainsKey ( node.id ) ) {
						nodeContainers[node.id] = new NodeContainer ( node );

					} else {
						// Set container data
						var container : NodeContainer = nodeContainers[node.id];
						container.node = node;
						container.inputRect = new Rect ( container.rect.x - 7, container.rect.y - 7, 14, 14 );
						
						// Set view rect
						viewRect.xMin = -20;
						
						if ( viewRect.xMax < container.rect.xMax ) {
							viewRect.xMax = container.rect.xMax + 20;
						}
						
						if ( viewRect.yMax < container.rect.yMax ) {
							viewRect.yMax = container.rect.yMax + 120;
						}
						

						// Draw container						
						GUI.Box ( container.rect, "" );
						
						// Debug
						var debugRect : Rect = new Rect ( container.rect.xMax, container.rect.yMax, 100, 100 );
						//GUI.Label ( debugRect, "o: " + node.connectedTo.Length + "\n" + "oc: " + container.outputs.Length + "\n" + "or: " + container.outputRects.Length );
						if ( node.connectedTo.Length > 0 ) {
							var lbl : String = node.id + "\n\n";

							for ( var lb : int = 0; lb < node.connectedTo.Length; lb++ ) {
								lbl += lb + ": " + node.connectedTo[lb] + "\n";
							}

							GUI.Label ( debugRect, lbl );
						}
						
						// ^ Input
						if ( GUI.Button ( container.inputRect, "" ) ) {
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
							var pos : Vector2 = new Vector2 ( container.rect.x, 20 );

							if ( container.input ) {
								pos.y = container.input.rect.y + nodeDistance;
							}

							container.rect = new Rect ( pos.x, pos.y, speak.lines.length * 240, 80 );

							EditorGUILayout.BeginHorizontal ();
							EditorGUILayout.LabelField ( "Speaker", GUILayout.Width ( 60 ) );
							speak.speaker = EditorGUILayout.Popup ( speak.speaker, GetSpeakerStrings ( tree ), GUILayout.Width ( 120 ) );
							EditorGUILayout.EndHorizontal ();
					
							EditorGUILayout.Space ();

							EditorGUILayout.BeginHorizontal ();

							node.SetOutputAmount ( speak.lines.Length );
							container.SetOutputAmount ( node.connectedTo.Length );

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

								container.outputRects[l] = GUILayoutUtility.GetLastRect();
								
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
						for ( var o : int = 0; o < container.outputRects.Length; o++ ) {
							container.outputRects[o] = new Rect ( container.rect.x + 10 + container.outputRects[o].x, container.rect.yMax - 7, 14, 14 );
							if ( GUI.Button ( container.outputRects[o], "" ) ) {
								connecting = new NodeConnection ( container, o );
							}
							GUI.Label ( container.outputRects[o], o.ToString (), lblStyle );

							var cNode : OCNode = root.GetNode(node.connectedTo[o]);

							if ( cNode ) {
								var cContainer : NodeContainer = nodeContainers[cNode.id];
							
								if ( cContainer ) {
									cContainer.input = container;

									DrawBezierCurve ( container.outputRects[o].center, cContainer.inputRect.center );

									cContainer.rect.x = container.outputRects[o].x - 10;
								}

							} else {
								var newRect : Rect = container.outputRects[o];
								newRect.y += 20;

								GUI.backgroundColor = Color.green;
								if ( GUI.Button ( newRect, "" ) ) {
									var newNode : OCNode = root.AddNode ();
									node.connectedTo[o] = newNode.id;

									Debug.Log ( node.id + " | " + newNode.id );
								}
								GUI.Label ( newRect, "+", lblStyle );
								GUI.backgroundColor = Color.white;
							}
						}
					}
				}

			}
			
			// Draw connection bezier
			if ( connecting && connecting.container == container ) {
				DrawBezierCurve ( container.outputRects[connecting.output].center, Event.current.mousePosition );
			}
		
			if ( Event.current.type == EventType.MouseDown ) {
				connecting = null;
			}

			GUI.EndScrollView ();
		
			Repaint ();
		}
	}
}
