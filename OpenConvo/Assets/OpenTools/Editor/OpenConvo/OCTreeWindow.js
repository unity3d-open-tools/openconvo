#pragma strict

public class OCTreeWindow extends EditorWindow {
	private class NodeConnection {
		public var node : OCNode;
		public var output : int;
		public var rect : Rect;
		
		function NodeConnection ( node : OCNode, output : int, rect : Rect ) {
			this.node = node;
			this.output = output;
			this.rect = rect;
		}	
	}

	private var tree : OCTree;
	private var rects : Rect [,] = new Rect[999,999];
	private var scrollPos : Vector2;
	private var connecting : NodeConnection;
	private var drawnNodes : List.< OCNode > = new List.< OCNode > ();

   	static function ShowEditor ( tree : OCTree ) {
		var editor : OCTreeWindow = EditorWindow.GetWindow.<OCTreeWindow>();
        	editor.tree = tree;
    	}

	public function OnGUI() {
		if ( !tree ) { return; }
	
		drawnNodes.Clear ();

		BeginWindows();
	
		if ( GUILayout.Button ( "Clear" ) ) {
			tree.rootNodes[tree.currentRoot].connectedTo = -1;
		}

		scrollPos = GUILayout.BeginScrollView ( scrollPos );
	
		DrawNode ( tree.rootNodes[tree.currentRoot].connectedTo, 0, 0, new Rect ( 20, 20, 0, 0 ) );
		
		if ( Event.current.type == EventType.MouseDown ) {
			connecting = null;
		}

		GUILayout.EndScrollView ();
		
		EndWindows();
    	}

	public function Update () {
		Repaint ();
	}

	private function GetSpeakerStrings () : String[] {
		var result : String[] = new String [tree.speakers.Length];

		for ( var i : int = 0; i < result.Length; i++ ) {
			var go : GameObject = tree.speakers[i];
			
			result[i] = ( go == null ) ? i.ToString () : go.name;
		}

		return result;
	}

	private function GetTypeStrings () : String [] {
		return [ "Speak", "Event", "Jump", "SetFlag", "GetFlag" ];
	}

	private function GetTypeIndex ( type : String, types : String[] ) {
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

	private function DrawNode ( n : int, x : int, y : int, outRect : Rect ) {
		var node : OCNode = tree.childNodes[n];
		var rect : Rect = rects[x,y];
			
		if ( rect.width <= 0 ) { rect.width = 200; }
		if ( rect.height <= 0 ) { rect.height = 200; }

		if ( x > 0 ) {
			rect.x = rects[x-1,y].xMax + 20;
		} else {
			rect.x = 20;
		}

		rect.y = 20 + y * 200;
		
		if ( !node || node.GetType() == OCNode ) {
			if ( x == 0 && y == 0 ) {
				GUI.color = Color.green;
				if ( GUILayout.Button ( "+", GUILayout.Width ( 20 ), GUILayout.Height ( 20 ) ) ) {
					node = new OCSpeak ();
				}
				GUI.color = Color.white;
			}

			
		} else {
			var connections : Rect[] = new Rect[0];
			var inRect : Rect = new Rect ( rect.x - 7, rect.y - 7, 14, 14 );

			GUI.Box ( rect, "" );
			
			if ( GUI.Button ( inRect, "" ) ) {
				if ( connecting ) {
					connecting.node.connectedTo[connecting.output] = n;
					connecting = null;
				}
			}
			
			GUI.backgroundColor = Color.red;
			if ( GUI.Button ( new Rect ( rect.xMax - 27, rect.yMin - 1, 28, 14 ), "x" ) ) {
				rects[x,y] = new Rect ();
				return null;
			}
			GUI.backgroundColor = Color.white;

			var typeStrings : String[] = GetTypeStrings ();
			var typeIndex : int = GetTypeIndex ( node.GetType().ToString(), typeStrings );
			var newTypeIndex : int = 0;

			newTypeIndex = EditorGUI.Popup ( new Rect ( rect.x + 20, rect.y - 6, 100, 20 ), typeIndex, typeStrings );
			
			GUI.BeginGroup ( rect );
			GUILayout.BeginArea ( new Rect ( 10, 10, rect.width - 20, rect.height - 20 ) );


			EditorGUILayout.Space ();

			if ( newTypeIndex != typeIndex ) {
				node = NewNodeFromType ( typeStrings[newTypeIndex] );

			} else {
				var speak : OCSpeak = node as OCSpeak;

				if ( speak ) {
					EditorGUILayout.BeginHorizontal ();
					EditorGUILayout.LabelField ( "Speaker", GUILayout.Width ( 60 ) );
					speak.speaker = EditorGUILayout.Popup ( speak.speaker, GetSpeakerStrings (), GUILayout.Width ( 120 ) );
					EditorGUILayout.EndHorizontal ();
			
					EditorGUILayout.Space ();

					connections = new Rect [ speak.lines.Length ];
					
					var tmpConnect : List.< int > = new List.< int > ();
					
					for ( var i : int = 0; i < connections.Length; i++ ) {
						if ( i < speak.connectedTo.Length ) {
							tmpConnect.Add ( speak.connectedTo[i] );
						} else {
							tmpConnect.Add ( -1 );
						}
					}

					speak.connectedTo = tmpConnect.ToArray();

					EditorGUILayout.BeginHorizontal ();

					rect.width = speak.lines.Length * 240;
					rect.height = 80;

					for ( i = 0; i < speak.lines.Length; i++ ) {
						EditorGUILayout.BeginVertical ();
						
						EditorGUILayout.BeginHorizontal ();
					
						speak.lines[i] = EditorGUILayout.TextField ( speak.lines[i] );
						
						if ( i > 0 ) {
							GUI.backgroundColor = Color.red;
							if ( GUILayout.Button ( "x", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
								var tmpLines : List.<String> = new List.<String>(speak.lines);
								tmpLines.RemoveAt ( i );
								speak.lines = tmpLines.ToArray ();
							}
							GUI.backgroundColor = Color.white;
						} else {
							GUILayout.Space ( 28 );
						}
						
						EditorGUILayout.EndHorizontal ();

						connections[i] = GUILayoutUtility.GetLastRect();
						
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

			}


			GUILayout.EndArea ();
			GUI.EndGroup ();
			
			for ( i = 0; i < connections.Length; i++ ) {
				connections[i] = new Rect ( rect.x + 10 + connections[i].x, rect.yMax - 7, 14, 14 );
				
				if ( GUI.Button ( connections[i], "" ) ) {
					connecting = new NodeConnection ( node, i, connections[i] );
					node.connectedTo[i] = -1;
				}
				
				if ( node.connectedTo[i] == null || node.connectedTo[i].GetType() == OCNode ) {
					GUI.backgroundColor = Color.green;
					if ( GUI.Button ( new Rect ( connections[i].x, connections[i].y + 20, 14, 14 ), "" ) ) {
						node.connectedTo[i] = -1;
					}
					GUI.backgroundColor = Color.white;

				}
			}

		
			for ( i = 0; i < node.connectedTo.Length; i++ ) {
				DrawNode ( node.connectedTo[i], x + i, y + 1, connections[i] );
			}
			
			DrawNodeCurve ( outRect.center, inRect.center );

			if ( connecting && connecting.node ) {
				DrawNodeCurve ( connecting.rect.center, Event.current.mousePosition );
			}

		}

		rects[x,y] = rect;

		tree.childNodes[i] = node;
	}

    	private function DrawNodeCurve( start : Vector2, end : Vector2) {
		var startPos : Vector3 = new Vector3(start.x, start.y, 0);
		var endPos : Vector3 = new Vector3(end.x, end.y, 0);
		var startTan : Vector3 = startPos + Vector3.up * 50;
		var endTan : Vector3 = endPos - Vector3.up * 50;

		Handles.DrawBezier(startPos, endPos, startTan, endTan, new Color ( 1, 1, 1, 0.5 ), null, 1);
		
    	}

}
