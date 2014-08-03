#pragma strict

public enum OCNodeType {
	Speak,
	Event,
	Jump,
	SetFlag,
	GetFlag,
	SetQuest,
	GetQuest,
	End
}

public class OCTree extends MonoBehaviour {
	public var rootNodes : OCRootNode[] = new OCRootNode[0];
	public var currentRoot : int;
	public var speakers : String[] = new String[0];

	private static var random : System.Random = new System.Random ();

	public static function CreateID () : int {
		return random.Next ( 10000, 99999 );
	}

	public function get rootNodeStrings () : String [] {
		var strings : String [] = new String [ rootNodes.Length ];
		
		for ( var i : int = 0; i < strings.Length; i++ ) {
			strings[i] = i.ToString ();
		}

		return strings;
	}

	public function CleanUp () {
		for ( var i : int = 0; i < rootNodes.Length; i++ ) {
			var tmp : List.< OCNode > = new List.< OCNode > ( rootNodes[i].nodes );

			for ( var n : int = tmp.Count - 1; n >= 0; n-- ) {
				if ( tmp[n].id < 1 ) {
					tmp.RemoveAt ( n );
				}
			}

			rootNodes[i].nodes = tmp.ToArray ();
		}
	}	

	public function MoveRoot ( from : int, to : int ) {
		if ( to >= 0 && to < rootNodes.Length ) {
			var fromRootNode : OCRootNode = rootNodes[from];
			var toRootNode : OCRootNode = rootNodes[to];
			
			rootNodes[to] = fromRootNode;
			rootNodes[from] = toRootNode;
		}
	}

	public function AddSpeaker () {
		var tmpSpk : List.< String > = new List.< String > ( speakers );

		tmpSpk.Add ( "" );

		speakers = tmpSpk.ToArray ();
	}

	public function RemoveSpeaker ( i : int ) {
		var tmpSpk : List.< String > = new List.< String > ( speakers );

		tmpSpk.RemoveAt ( i );

		speakers = tmpSpk.ToArray ();
	}

	public function AddRootNode () {
		var tempNodes : List.< OCRootNode > = new List.< OCRootNode > ( rootNodes );

		tempNodes.Add ( new OCRootNode () );

		rootNodes = tempNodes.ToArray ();
	}
	
	public function RemoveRootNode ( i : int ) {
		if ( rootNodes.Length > 1 ) {
			var tempNodes : List.< OCRootNode > = new List.< OCRootNode > ( rootNodes );

			tempNodes.RemoveAt ( i );

			rootNodes = tempNodes.ToArray ();
		}
	}

	public function CurrentRootHasTag ( tag : String ) : boolean {
		for ( var t : String in rootNodes[currentRoot].tags ) {
			if ( t == tag ) {
				return true;
			}
		}

		return false;
	}
}

public class OCRootNode {
	public var tags : String[] = new String[0];
	public var firstNode : int;
	public var nodes : OCNode [] = new OCNode[0];

	public function ClearNodes () {
		nodes = new OCNode [0];
	}

	public function AddNode () : OCNode {
		var tmpNodes : List.< OCNode > = new List.< OCNode > ( nodes );
		var newNode : OCNode = new OCNode ();
		newNode.SetType ( OCNodeType.Speak, true );

		tmpNodes.Add ( newNode );

		nodes = tmpNodes.ToArray ();

		return newNode;
	}

	public function AddFirstNode () {
		var newNode : OCNode = AddNode ();

		firstNode = newNode.id;
	}

	public function GetFirstNode () : OCNode {
		return GetNode ( firstNode );
	}

	public function RemoveNode ( id : int ) {
		var tmpNodes : List.< OCNode > = new List.< OCNode > ( nodes );
		var removeIndex : int = -1;

		// Find node
		for ( var i : int = 0; i < tmpNodes.Count; i++ ) {
			if ( tmpNodes[i].id == id ) {
				removeIndex = i;
				break;
			}
		}

		// Fix broken links
		for ( i = 0; i < tmpNodes.Count; i++ ) {
			for ( var c : int = 0; c < tmpNodes[i].connectedTo.Length; c++ ) {
				if ( tmpNodes[i].connectedTo[c] == id ) {
					if ( removeIndex > 0 && tmpNodes[removeIndex].connectedTo.Length > 0 ) {
						tmpNodes[i].connectedTo[c] = tmpNodes[removeIndex].connectedTo[0];
					}
				}
			}
		}

		// Remove node
		if ( removeIndex > 0 ) {
			tmpNodes.RemoveAt ( removeIndex );
		}

		nodes = tmpNodes.ToArray ();
	}

	public function GetNode ( id : int ) : OCNode {
		for ( var i : int = 0; i < nodes.Length; i++ ) {
			if ( nodes[i].id == id ) {
				return nodes[i];
			}
		}

		return null;
	}

	public function RemoveTag ( id : String ) {
		var tmpTags : List.< String > = new List.< String > ( tags );
		
		if ( tmpTags.Contains ( id ) ) {
			tmpTags.Remove ( id );
			tags = tmpTags.ToArray ();
		}
	}

	public function SetTag ( id : String ) {
		var tmpTags : List.< String > = new List.< String > ( tags );
		
		if ( !tmpTags.Contains ( id ) ) {
			tmpTags.Add ( id );
			tags = tmpTags.ToArray ();
		}
	}
	
	public function GetTag ( id : String ) : boolean {
		for ( var i : int = 0; i < tags.Length; i++ ) {
			if ( tags[i] == id ) {
				return true;
			}
		}

		return false;
	}
}

public class OCNode {
	public var connectedTo : int[] = new int[0];
	public var id : int;
	public var type : OCNodeType;

	public var speak : OCSpeak;
	public var event : OCEvent;
	public var jump : OCJump;
	public var setFlag : OCSetFlag;
	public var getFlag : OCGetFlag;
	public var setQuest : OCSetQuest;
	public var getQuest : OCGetQuest;
	public var end : OCEnd;

	function OCNode () {
		id = OCTree.CreateID ();
	}

	public function SetConnection ( i : int, id : int ) {
		if ( i >= connectedTo.Length ) {
			SetOutputAmount ( i + 1 );
		}

		connectedTo[i] = id;
	}

	public function SetOutputAmount ( n : int ) {
		if ( n < 1 ) {
			connectedTo = new int[0];
		} else {
			var tmpConnect : List.< int > = new List.< int > ( connectedTo );
			
			if ( n > connectedTo.Length ) {
				for ( var i : int = connectedTo.Length; i < n; i++ ) {
					tmpConnect.Add ( 0 );
				}

				connectedTo = tmpConnect.ToArray ();
			
			} else if ( n < connectedTo.Length ) {
				for ( i = connectedTo.Length - 1; i >= n; i-- ) {
					tmpConnect.RemoveAt ( i );
				}
				
				connectedTo = tmpConnect.ToArray ();
				
			}
		}
	}

	public function Reset () {
		speak = null;
		event = null;
		jump = null;
		setFlag = null;
		getFlag = null;
		end = null;
	}

	public function SetType ( string : String ) {
		var type : int = 0;
		var names : String [] = System.Enum.GetNames ( OCNodeType );

		for ( var i : int = 0; i < names.Length; i++ ) {
			if ( names[i] == string ) {
				type = i;
			}
		}

		SetType ( type );
	}

	public function SetType ( value : OCNodeType ) {
		SetType ( value, false );
	}

	public function SetType ( value : OCNodeType, force : boolean ) {
		if ( value != type || force ) {
			type = value;
			
			Reset ();

			switch ( type ) {
				case OCNodeType.Speak:
					speak = new OCSpeak ();
					SetOutputAmount ( 1 );
					break;
				
				case OCNodeType.Event:
					event = new OCEvent ();
					SetOutputAmount ( 1 );
					break;
				
				case OCNodeType.Jump:
					jump = new OCJump ();
					SetOutputAmount ( 0 );
					break;
				
				case OCNodeType.SetFlag:
					setFlag = new OCSetFlag ();
					SetOutputAmount ( 1 );
					break;
				
				case OCNodeType.GetFlag:
					getFlag = new OCGetFlag ();
					SetOutputAmount ( 2 );
					break;
				
				case OCNodeType.SetQuest:
					setQuest = new OCSetQuest ();
					SetOutputAmount ( 1 );
					break;

				case OCNodeType.GetQuest:
					getQuest = new OCGetQuest ();
					SetOutputAmount ( 2 );
					break;

				case OCNodeType.End:
					end = new OCEnd ();
					SetOutputAmount ( 0 );	
					break;
			}
		}
	}
}

public class OCSpeak {
	public class Line {
		public var text : String;
		public var audio : AudioClip;
		public var animation : String;
		public var facing : int = 0;
		
		function Line ( text : String, audio : AudioClip, animation : String, facing : int ) {
			this.text = text;
			this.audio = audio;
			this.animation = animation;
			this.facing = facing;
		}
	}
	
	public var speaker : int;
	public var lines : Line[] = new Line[0];
	public var smalltalk : boolean = false;
	public var index : int = 0;

	function OCSpeak () {
		lines = [ new Line ( "", null, "", 0 ) ];
	}

	public function get facing () : int {
		return lines[index].facing;
	}

	public function get choice () : boolean {
		return !smalltalk && lines.Length > 1;
	}

	public function RemoveLine ( i : int ) {
		var tmp : List.< Line > = new List.< Line > ( lines );

		tmp.RemoveAt ( i );

		lines = tmp.ToArray ();
	}

	public function AddLine () {
		var tmp : List.< Line > = new List.< Line > ( lines );

		tmp.Add ( new Line ( "", null, "", 0 ) );

		lines = tmp.ToArray ();
	}
}

public class OCEvent {
	public var message : String;
	public var argument : String;
	public var object : GameObject;
	public var objectPath : String;
	public var objectId : String;
	public var eventToTarget : boolean = false;
}

public class OCJump {
	public var rootNode : int;
}

public class OCEnd {
	public var rootNode : int;
}

public class OCSetFlag {
	public var flag : String;
	public var b : boolean;
}

public class OCGetFlag {
	public var flag : String;
}

public class OCSetQuest {
	public var quest : String;
	public var objective : int;
	public var completed : boolean;
}

public class OCGetQuest {
	public var quest : String;
	public var objective : int;
	public var completed : boolean;
}
