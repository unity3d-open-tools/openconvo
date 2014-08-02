#pragma strict

public class OCTreeEditor extends EditorWindow {
	public class Range extends System.ValueType {
		public var from : float;
		public var to : float;
	}
	
	public static var target : OCTree;
	public static var currentRoot : int;
	public static var currentNode : int;

	private var speakerColors : Color [] = [
		new Color ( 0.6, 0.8, 1.0, 1.0 ),
		new Color ( 0.6, 1.0, 0.8, 1.0 ),
		new Color ( 0.2, 0.5, 0.4, 1.0 ),
		new Color ( 0.1, 0.2, 0.8, 1.0 ),
		new Color ( 0.8, 1.0, 0.2, 1.0 ),
		new Color ( 0.4, 0.5, 0.8, 1.0 ),
		new Color ( 0.3, 0.2, 0.6, 1.0 ),
		new Color ( 0.8, 0.3, 0.2, 1.0 ),
		new Color ( 0.1, 0.4, 0.4, 1.0 ),
		new Color ( 0.9, 0.1, 0.8, 1.0 )
	];
	private var distance : Vector2 = new Vector2 ( 400, 100 );
	private var scrollPosition : Vector2;
	private var scrollRect : Rect;
	private var inspectorScrollPosition : Vector2;
	private var manager : OCManager;
	private var connectingNode : int = 0;
	private var connectingOutput : int = 0;
	private var placedInputs : Dictionary.< int, Rect > = new Dictionary.< int, Rect > ();

	private function get node () : OCNode {
		return target.rootNodes [ currentRoot ].GetNode ( currentNode );
	}
	
	private function set node ( value : OCNode ) {
		currentNode = value.id;
	}

	private function DrawLine ( start : Vector2, end : Vector2 ) {
		var points : List.< Vector3 > = new List.< Vector3 > ();

		points.Add ( new Vector3 ( start.x, start.y, 0 ) );
		
		if ( start.x != end.x ) {
			if ( start.y < end.y ) {
				points.Add ( new Vector3 ( start.x, end.y - 20, 0 ) );
				points.Add ( new Vector3 ( end.x, end.y - 20, 0 ) );
			
			} else if ( start.y > end.y ) {
				points.Add ( new Vector3 ( start.x, start.y + 30, 0 ) );
				points.Add ( new Vector3 ( ( start.x + end.x ) / 2, start.y + 30, 0 ) );
				points.Add ( new Vector3 ( ( start.x + end.x ) / 2, end.y - 20, 0 ) );
				points.Add ( new Vector3 ( end.x, end.y - 20, 0 ) );

			}
		}

		points.Add ( new Vector3 ( end.x, end.y, 0 ) );
		
		Handles.color = new Color ( 1.0, 1.0, 1.0, 0.33 );
		Handles.DrawAAPolyLine ( points.ToArray () );
	}

	private function DrawInspector () {
		var i : int = 0;
		var type : OCNodeType = EditorGUILayout.Popup ( "Type", node.type, System.Enum.GetNames ( OCNodeType ) );
		
		if ( type != node.type ) {
			node.SetType ( type );
		}

		GUILayout.Space ( 20 );

		switch ( node.type ) {
			case OCNodeType.Speak:
				GUI.backgroundColor = speakerColors [ node.speak.speaker ];
				node.speak.speaker = EditorGUILayout.Popup ( "Speaker", node.speak.speaker, target.speakers );
				GUI.backgroundColor = Color.white;

				node.speak.smalltalk = EditorGUILayout.Toggle ( "Smalltalk", node.speak.smalltalk );

				GUILayout.Space ( 10 );
				
				for ( i = 0; i < node.speak.lines.Length; i++ ) { 
					GUILayout.BeginHorizontal ();
					
					GUILayout.Label ( i.ToString() );
					
					GUI.color = Color.red;
					if ( node.speak.lines.Length > 1 && GUILayout.Button ( "x", GUILayout.Height ( 16 ), GUILayout.Width ( 32 ) ) ) {
						node.speak.RemoveLine ( i );
						return;
					}
					GUI.color = Color.white;
					
					GUILayout.EndHorizontal ();
				
					GUILayout.Space ( 10 );
					
					var line : OCSpeak.Line = node.speak.lines [ i ];
					
					line.text = GUILayout.TextArea ( line.text, GUILayout.Height ( 80 ) );
					line.audio = EditorGUILayout.ObjectField ( "Audio", line.audio, typeof ( AudioClip ), false ) as AudioClip;
					GUI.backgroundColor = speakerColors [ line.facing ];
					line.facing = EditorGUILayout.Popup ( "Facing", line.facing, target.speakers );
					GUI.backgroundColor = Color.white;
					GUILayout.Space ( 20 );
				}

				GUI.color = Color.green;
				if ( GUILayout.Button ( "+", GUILayout.Height ( 16 ), GUILayout.Width ( 32 ) ) ) {
					node.speak.AddLine ();
				}
				GUI.color = Color.white;
			
				if ( node.speak.smalltalk ) {
					node.SetOutputAmount ( 1 );

				} else if ( node.connectedTo.Length != node.speak.lines.Length ) {
					node.SetOutputAmount ( node.speak.lines.Length );
				}
					
				break;

			case OCNodeType.Event:
				node.event.message = EditorGUILayout.TextField ( "Message", node.event.message );
				node.event.argument = EditorGUILayout.TextField ( "Argument", node.event.argument );
				node.event.object = EditorGUILayout.ObjectField ( "Target object", node.event.object, typeof ( GameObject ), true ) as GameObject;
				node.event.eventToTarget = EditorGUILayout.Toggle ( "Event to target", node.event.eventToTarget );
				
				break;
			
			case OCNodeType.Jump:
				node.jump.rootNode = EditorGUILayout.Popup ( "To root node", node.jump.rootNode, target.rootNodeStrings );
				
				break;

			case OCNodeType.End:
				node.end.rootNode = EditorGUILayout.Popup ( "Next root node", node.end.rootNode, target.rootNodeStrings );
			
				break;

			case OCNodeType.SetFlag:
				node.setFlag.flag = EditorGUILayout.TextField ( "Flag", node.setFlag.flag );
				node.setFlag.b = EditorGUILayout.Toggle ( "Bool", node.setFlag.b );
			
				break;

			case OCNodeType.GetFlag:
				node.getFlag.flag = EditorGUILayout.TextField ( "Flag", node.getFlag.flag );
			
				break;

			case OCNodeType.SetQuest:
				if ( !manager ) {
					manager = EditorGUILayout.ObjectField ( "Select OCManager object", manager, typeof ( OCManager ), true ) as OCManager;
				
				} else {
					var questNames : String [] = manager.quests.GetQuestNames ();
					
					if ( questNames.Length > 0 ) {
						node.setQuest.quest = questNames [ EditorGUILayout.Popup ( "Quest", manager.quests.GetIndex ( node.setQuest.quest ), questNames ) ];
						var objectiveNames : String[] = manager.quests.GetObjectiveNames ( node.setQuest.quest );

						if ( objectiveNames.Length > 0 ) {
							node.setQuest.objective = EditorGUILayout.Popup ( "Objective", node.setQuest.objective, objectiveNames );
						
						} else {
							GUILayout.Label ( "Objective" );

						}

						node.setQuest.completed = EditorGUILayout.Toggle ( "Completed", node.setQuest.completed );
					
					} else {
						GUILayout.Label ( "No potential quests in OCManager!" );

					}
				}

				break;

			case OCNodeType.GetQuest:
				if ( !manager ) {
					manager = EditorGUILayout.ObjectField ( "Select OCManager object", manager, typeof ( OCManager ), true ) as OCManager;
				
				} else {
					questNames = manager.quests.GetQuestNames ();
					
					if ( questNames.Length > 0 ) {
						node.getQuest.quest = questNames [ EditorGUILayout.Popup ( "Quest", manager.quests.GetIndex ( node.getQuest.quest ), questNames ) ];
						objectiveNames = manager.quests.GetObjectiveNames ( node.getQuest.quest );

						if ( objectiveNames.Length > 0 ) {
							node.getQuest.objective = EditorGUILayout.Popup ( "Objective", node.getQuest.objective, objectiveNames );
						
						} else {
							GUILayout.Label ( "Objective" );

						}

						node.getQuest.completed = EditorGUILayout.Toggle ( "Completed", node.getQuest.completed );
					
					} else {
						GUILayout.Label ( "No potential quests in OCManager!" );

					}
				
				}

				break;
		}
	}

	private function DrawNode ( n : OCNode, x : float, y : float ) {
		var nodeText : String = "";
		var nodeColor : Color = Color.white;

		switch ( n.type ) {
			case OCNodeType.Speak:
				nodeColor = speakerColors [ n.speak.speaker ];
				
				if ( n.speak.lines.Length == 1 ) {
					nodeText = n.speak.lines[0].text;

					if ( nodeText.Length < 1 ) {
						nodeText = "...";

					} else if ( nodeText.Length > 16 ) {
						nodeText = nodeText.Substring ( 0, 13 ) + "...";
					}
				
				} else {
					if ( n.speak.smalltalk ) {
						nodeText = "(smalltalk)";
					
					} else {
						nodeText = "(choice)";

					}

				}
				
				break;
			
			case OCNodeType.Event:
				nodeText = "(event)";
				
				break;
			
			case OCNodeType.End:
				nodeText = "(end)";
				
				break;
			
			case OCNodeType.Jump:
				nodeText = "(jump)";
				
				break;
			
			case OCNodeType.SetQuest:
				nodeText = "(set quest)";
				
				break;

			case OCNodeType.GetQuest:
				nodeText = "(get quest)";
				
				break;
			
			case OCNodeType.SetFlag:
				nodeText = "(set flag)";
				
				break;

			case OCNodeType.GetFlag:
				nodeText = "(get flag)";
				
				break;
		}
	
		GUI.backgroundColor = nodeColor;
		if ( GUI.Button ( new Rect ( x - 50, y, 100, 40 ), nodeText ) ) {
			if ( connectingNode > 0 ) {
				var fromNode : OCNode = target.rootNodes [ currentRoot ].GetNode ( connectingNode );

				if ( fromNode ) {
					fromNode.connectedTo[connectingOutput] = n.id;
					connectingNode = 0;
					connectingOutput = 0;
					return;
				}
			}
			
			node = n;
		}
		GUI.backgroundColor = Color.white;

		GUI.color = Color.red;
		if ( GUI.Button ( new Rect ( x + 30, y - 6, 24, 12 ), "x" ) ) {
			n.id = 0;
			return;
		}
		GUI.color = Color.white;

		// Input
		var inputRect : Rect = new Rect ( x - 6, y - 6, 12, 12 );
		
		placedInputs.Add ( n.id, inputRect );

		if ( GUI.Button ( inputRect, "" ) ) {
		}

		for ( var i : int = 0; i < n.connectedTo.Length; i++ ) {
			var nextId : int = n.connectedTo[i];
			var xPos : float = x;
			var nodeXPos : float = xPos;
			
			if ( n.connectedTo.Length > 1 ) {
				var span : float = distance.x;
				var segment : float = span / ( n.connectedTo.Length - 1 );
				xPos = x - span / 2 + i * segment;
				nodeXPos = x - 100 / 2 + i * ( 100 / ( n.connectedTo.Length - 1 ) );
			}
			
			GUI.color = Color.green;
			if ( GUI.Button ( new Rect ( nodeXPos - 12, y + 50, 24, 12 ), "+" ) ) {
				var newNode : OCNode = target.rootNodes [ currentRoot ].AddNode ();
				
				if ( n.connectedTo [ i ] > 0 ) { 
					newNode.connectedTo [ 0 ] = n.connectedTo [ i ];
				}
				
				n.connectedTo [ i ] = newNode.id;

				node = newNode;
			}
			GUI.color = Color.white;
			
			var outputRect : Rect;

			if ( n.type == OCNodeType.GetFlag || n.type == OCNodeType.GetQuest ) {
				var bString : String = i == 0 ? "false" : "true";
				outputRect = new Rect ( nodeXPos - 24, y + 32, 48, 14 );

				if ( GUI.Button ( outputRect, bString ) ) {
					connectingNode = n.id;
					connectingOutput = i;
				}
			
			} else {
				outputRect = new Rect ( nodeXPos - 6, y + 34, 12, 12 );

				if ( GUI.Button ( outputRect, "" ) ) {
					connectingNode = n.id;
					connectingOutput = i;
				}
			}
				
			if ( nextId > 0 ) {
				var nextNode : OCNode = target.rootNodes[currentRoot].GetNode ( nextId );

				if ( !nextNode ) {
					n.connectedTo[i] = 0;
					return;
				}
		
				if ( placedInputs.ContainsKey ( nextId ) ) {
					DrawLine ( new Vector2 ( nodeXPos, y + 40 ), placedInputs[nextId].center );
					
				} else {
					DrawLine ( new Vector2 ( nodeXPos, y + 40 ), new Vector2 ( xPos, y + distance.y ) );
					DrawNode ( nextNode, xPos, y + distance.y );
				}
			}

			if ( connectingNode == n.id && connectingOutput == i ) {
				DrawLine ( outputRect.center, Event.current.mousePosition );
			}
		}
	}

	public function OnGUI () {	
		placedInputs.Clear ();
		
		title = "Tree Editor";
		
		distance.x = 220;
		distance.y = 100;
		
		if ( !target ) {
			EditorGUI.LabelField ( new Rect ( position.width / 2 - 42, position.height / 2 - 10, 84, 20 ), "No target tree!", EditorStyles.boldLabel );
			return;
		
		}

		if ( target.rootNodes.Length < 1 ) {
			target.AddRootNode ();
		}

		if ( currentRoot > target.rootNodes.Length - 1 ) {
			currentRoot = target.rootNodes.Length - 1;
		}

		// Inspector
		var inspectorRect : Rect = new Rect ( position.width - 300, 0, 300, position.height );
		var innerInspectorRect : Rect = new Rect ( inspectorRect.x + 10, inspectorRect.y + 10, inspectorRect.width - 20, inspectorRect.height - 20 );
		
		GUILayout.BeginArea ( innerInspectorRect );
		
		var i : int;

		GUILayout.Label ( "Tree (" + target.gameObject.name + ")", EditorStyles.largeLabel );
		GUILayout.Box ( "", GUILayout.Height ( 1 ), GUILayout.Width ( 270 ) );

		// ^ Speaker names
		if ( target.speakers.Length < 1 ) {
			var tmpStr : List.< String > = new List.< String > ( target.speakers );
			tmpStr.Add ( "Speaker" );
			target.speakers = tmpStr.ToArray ();
		}
		
		GUILayout.Label ( "Speaker names", EditorStyles.boldLabel );		
		for ( i = 0; i < target.speakers.Length; i++ ) {
			GUILayout.BeginHorizontal ();

			GUI.backgroundColor = speakerColors[i];
			target.speakers[i] = GUILayout.TextField ( target.speakers[i] );
			GUI.backgroundColor = Color.white;

			GUI.color = Color.red;
			if ( target.speakers.Length > 1 && GUILayout.Button ( "x", GUILayout.Height ( 16 ), GUILayout.Width ( 32 ) ) ) {
				tmpStr = new List.< String > ( target.speakers );
				tmpStr.RemoveAt ( i );
				target.speakers = tmpStr.ToArray ();
				return;
			}
			GUI.color = Color.white;

			GUILayout.EndHorizontal ();
		}
		
		GUI.color = Color.green;
		if ( target.speakers.Length < 10 && GUILayout.Button ( "+", GUILayout.Height ( 16 ), GUILayout.Width ( 32 ) ) ) {
			tmpStr = new List.< String > ( target.speakers );
			tmpStr.Add ( "Speaker" );
			target.speakers = tmpStr.ToArray ();
		}
		GUI.color = Color.white;

		GUILayout.Space ( 20 );

		GUILayout.Label ( "Root", EditorStyles.largeLabel );
		GUILayout.Box ( "", GUILayout.Height ( 1 ), GUILayout.Width ( 270 ) );

		// ^ Tags
		var tags : String[] = target.rootNodes[currentRoot].tags;
		var tagString : String = "";

		for ( i = 0; i < tags.Length; i++ ) {
			tagString += tags[i];

			if ( i < tags.Length - 1 ) {
				tagString += ",";
			}
		}
		
		GUILayout.Label ( "Tags", EditorStyles.boldLabel );
		tagString = GUILayout.TextField ( tagString );
		
		target.rootNodes[currentRoot].tags = tagString.Split ( ","[0] );

		GUILayout.Space ( 20 );

		// ^ Node
		GUILayout.Label ( "Node", EditorStyles.largeLabel );
		GUILayout.Box ( "", GUILayout.Height ( 1 ), GUILayout.Width ( 270 ) );

		inspectorScrollPosition = GUILayout.BeginScrollView ( inspectorScrollPosition );

		if ( node ) {
			DrawInspector ();
		}

		GUILayout.EndScrollView ();

		GUILayout.EndArea ();

		scrollRect = new Rect ( 0, 0, position.width - inspectorRect.width, position.height );
		
		GUI.Box ( scrollRect, "" );

		// Tree editor
		scrollPosition = EditorGUILayout.BeginScrollView ( scrollPosition, GUILayout.Width ( scrollRect.width ), GUILayout.Height ( scrollRect.height ) );

		var center : Vector2 = scrollRect.center;
		var right : float = center.x - ( ( target.rootNodes.Length * 1.0 ) / 2 ) * 32;

		// ^ Root navigation
		if ( currentRoot > 0 && GUI.Button ( new Rect ( right + ( currentRoot - 1 ) * 32 - 16, 8, 32, 16 ), "<" ) ) {
			var tmpRoot : List.< OCRootNode > = new List.< OCRootNode > ( target.rootNodes );
			var thisRoot : OCRootNode = tmpRoot [ currentRoot ];
			var thatRoot : OCRootNode = tmpRoot [ currentRoot - 1 ];
			tmpRoot [ currentRoot ] = thatRoot;
			tmpRoot [ currentRoot - 1 ] = thisRoot;
			target.rootNodes = tmpRoot.ToArray ();
			currentRoot--;
		}

		GUI.color = Color.red;
		if ( GUI.Button ( new Rect ( right + currentRoot * 32 - 16, 8, 32, 16 ), "x" ) ) {
			target.RemoveRootNode ( currentRoot ); 	
			return;
		}
		GUI.color = Color.white;

		if ( currentRoot < target.rootNodes.Length - 1 && GUI.Button ( new Rect ( right + ( currentRoot + 1 ) * 32 - 16, 8, 32, 16 ), ">" ) ) {
			tmpRoot = new List.< OCRootNode > ( target.rootNodes );
			thisRoot = tmpRoot [ currentRoot ];
			thatRoot = tmpRoot [ currentRoot + 1 ];
			tmpRoot [ currentRoot ] = thatRoot;
			tmpRoot [ currentRoot + 1 ] = thisRoot;
			target.rootNodes = tmpRoot.ToArray ();
			currentRoot++;
		}

		// ^ Root display
		for ( i = 0; i < target.rootNodes.Length; i++ ) {
			if ( i == currentRoot ) { 
				GUI.color = Color.white;
			
			} else {
				GUI.color = Color.grey;

			}
			
			if ( GUI.Button ( new Rect ( right + i * 32 - 16, 32, 32, 16 ), i.ToString() ) ) {
				currentRoot = i;
			}

			GUI.color = Color.white;
		}
		
		// ^ Add root node
		GUI.color = Color.green;
		if ( GUI.Button ( new Rect ( right + i * 32 - 16, 32, 32, 16 ), "+" ) ) {
			target.AddRootNode ();
		}
		GUI.color = Color.white;

		// ^ Node display
		GUI.color = Color.green;
		if ( GUI.Button ( new Rect ( right + currentRoot * 32 - 12, 56, 24, 12 ), "+" ) ) {
			target.AddRootNode ();
		}
		
		GUI.color = Color.white;
		if ( target.rootNodes[currentRoot].nodes.Length < 1 ) {
			target.rootNodes[currentRoot].AddFirstNode ();
		}
		
		DrawLine ( new Vector2 ( right + currentRoot * 32, 48 ), new Vector2 ( center.x, 96 ) );
		DrawNode ( target.rootNodes[currentRoot].GetNode ( target.rootNodes[currentRoot].firstNode ), center.x, 96 );

		GUILayout.EndScrollView ();

		if ( Event.current.type == EventType.MouseDown ) {
			var cNode : OCNode = target.rootNodes [ currentRoot ].GetNode ( connectingNode );
			
			if ( cNode ) {
				cNode.connectedTo[connectingOutput] = 0;
			}

			connectingNode = 0;
			connectingOutput = 0;
		}

		if ( connectingNode > 0 ) {
			Repaint ();
		}
	}
}
