#pragma strict

public enum OCNodeType {
	None,
	Speak,
	Event,
	Jump,
	SetFlag,
	GetFlag
}

public class OCTree extends MonoBehaviour {
	public var rootNodes : OCRootNode[] = new OCRootNode[1];
	public var currentRoot : int;
	public var speakers : GameObject[] = new GameObject[1];
	public var eventHandler : GameObject;

	private static var random : System.Random = new System.Random ();

	public static function CreateID () : int {
		return random.Next ( 10000, 99999 );
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
		var newNode : OCNode = new OCSpeak ();

		tmpNodes.Add ( newNode );

		nodes = tmpNodes.ToArray ();

		return newNode;
	}

	public function AddFirstNode () {
		var newNode : OCNode = AddNode ();

		firstNode = newNode.id;
	}
	
	public function RemoveNode ( id : int ) {
		var tmpNodes : List.< OCNode > = new List.< OCNode > ( nodes );

		for ( var i : int = 0; i < tmpNodes.Count; i++ ) {
			if ( tmpNodes[i].id == id ) {
				tmpNodes.RemoveAt ( i );
			}
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

	public function SetOutputAmount ( n : int ) {
		var tmpConnect : List.< int > = new List.< int > ( connectedTo );
		
		if ( n > connectedTo.Length ) {
			for ( var i : int = connectedTo.Length; i < n; i++ ) {
				tmpConnect.Add ( 0 );
			}

			connectedTo = tmpConnect.ToArray ();
		
		} else if ( n < connectedTo.Length ) {
			for ( i = n; i < connectedTo.Length; i++ ) {
				tmpConnect.RemoveAt ( i );
			}
			
			connectedTo = tmpConnect.ToArray ();
			
		}
	}
}

public class OCSpeak {
	public var speaker : int;
	public var lines : String[] = new String[1];

	function OCSpeak () {
		connectedTo = new int[1];
		id = OCTree.CreateID ();
	}
}

public class OCEvent {
	public var message : String;
	public var argument : String;
 
	function OCEvent () {
		connectedTo = new int[1];
		id = OCTree.CreateID ();
	}
}

public class OCJump {
	public var rootNode : int;
}

public class OCSetFlag {
	public var flag : String;
	public var b : boolean;
	
	function OCSetFlag () {
		connectedTo = new int[1];
		id = OCTree.CreateID ();
	}
}

public class OCGetFlag {
	public var flag : String;
	
	function OCGetFlag () {
		connectedTo = new int[2];
		id = OCTree.CreateID ();
	}
}
