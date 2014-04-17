#pragma strict

public class OCTree extends MonoBehaviour {
	public var rootNodes : OCRootNode[] = new OCRootNode[1];
	public var currentRoot : int;
	public var speakers : GameObject[] = new GameObject[1];
	public var eventHandler : GameObject;

	private static var random : System.Random = new System.Random ();

	public static function CreateID () : int {
		return random.Next ( 10000, 99999 );
	}

	public function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );
		var rn : JSONObject = new JSONObject ( JSONObject.Type.ARRAY );
		var spkObjects : JSONObject = new JSONObject ( JSONObject.Type.ARRAY );

		for ( var i : int = 0; i < speakers.Length; i++ ) {
			spkObjects.Add ( speakers[i].name );
		}

		for ( i = 0; i < rootNodes.Length; i++ ) {
			rn.Add ( rootNodes[i].Serialize () );
		}		

		output.AddField ( "rootNodes", rn );
		output.AddField ( "speakers", spkObjects );

		return output;
	}
}

public class OCRootNode {
	public var tags : String[] = new String[0];
	public var firstNode : int;
	public var childNodes : OCNode [] = new OCNode[0];

	public function ClearNodes () {
		childNodes = new OCNode [0];
	}

	public function AddNode () : OCNode {
		var tmpNodes : List.< OCNode > = new List.< OCNode > ( childNodes );
		var newNode : OCNode = new OCSpeak ();

		tmpNodes.Add ( newNode );

		childNodes = tmpNodes.ToArray ();

		return newNode;
	}

	public function AddFirstNode () {
		var newNode : OCNode = AddNode ();

		firstNode = newNode.id;
	}
	
	public function GetNode ( id : int ) : OCNode {
		for ( var i : int = 0; i < childNodes.Length; i++ ) {
			if ( childNodes[i].id == id ) {
				return childNodes[i];
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

	public function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );
		var t : JSONObject = new JSONObject ( JSONObject.Type.ARRAY );

		for ( var i : int = 0; i < tags.Length; i++ ) {
			t.Add ( tags[i] );
		}

		output.AddField ( "tags", t );
		output.AddField ( "firstNode", firstNode );
		
		return output;
	}
}

public class OCNode {
	public var connectedTo : int[] = new int[0];
	public var id : int;

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

	public function Serialize () : JSONObject {}
	public function SerializeConnections () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.ARRAY );

		for ( var i : int = 0; i < connectedTo.Length; i++ ) {
			output.Add ( connectedTo[i] );
		}

		return output;
	}	
}

public class OCSpeak extends OCNode {
	public var speaker : int;
	public var lines : String[] = new String[1];

	function OCSpeak () {
		connectedTo = new int[1];
		id = OCTree.CreateID ();
	}

 	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );
		var l : JSONObject = new JSONObject ( JSONObject.Type.ARRAY );

		output.AddField ( "id", id );
		output.AddField ( "type", "OCSpeak" );
		output.AddField ( "speaker", speaker );
		
		for ( var i : int = 0; i < lines.Length; i++ ) {
			l.Add ( lines[i] );
		}

		output.AddField ( "lines", l );
		output.AddField ( "connectedTo", SerializeConnections () );

		return output;
	}
}

public class OCEvent extends OCNode {
	public var message : String;
	public var argument : String;
 
	function OCEvent () {
		connectedTo = new int[1];
		id = OCTree.CreateID ();
	}

	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "id", id );
		output.AddField ( "type", "OCEvent" );
		output.AddField ( "message", message );
		output.AddField ( "argument", argument );
		output.AddField ( "connectedTo", SerializeConnections () );
		
		return output;
	}
}

public class OCJump extends OCNode {
	public var rootNode : int;
	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "id", id );
		output.AddField ( "type", "OCJump" );
		output.AddField ( "rootNode", rootNode );
		output.AddField ( "connectedTo", SerializeConnections () );
		
		return output;
	}
}

public class OCSetFlag extends OCNode {
	public var flag : String;
	public var b : boolean;
	
	function OCSetFlag () {
		connectedTo = new int[1];
		id = OCTree.CreateID ();
	}

	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "id", id );
		output.AddField ( "type", "OCSetFlag" );
		output.AddField ( "flag", flag );
		output.AddField ( "boolean", b );
		output.AddField ( "connectedTo", SerializeConnections () );
		
		return output;
	}
}

public class OCGetFlag extends OCNode {
	public var flag : String;
	
	function OCGetFlag () {
		connectedTo = new int[2];
		id = OCTree.CreateID ();
	}
	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "id", id );
		output.AddField ( "type", "OCGetFlag" );
		output.AddField ( "flag", flag );
		output.AddField ( "connectedTo", SerializeConnections () );
		
		return output;
	}
}
