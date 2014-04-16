#pragma strict

public class OCTree extends MonoBehaviour {
	public var rootNodes : OCRootNode[];
	public var childNodes : OCNode [];
	public var currentRoot : int;
	public var speakers : GameObject[] = new GameObject[1];
	public var eventHandler : GameObject;

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
	public var auto : boolean = false;
	public var passive : boolean = false;
	public var connectedTo : int;

	public function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "auto", auto );
		output.AddField ( "passive", passive );
		output.AddField ( "connectedTo", connectedTo );
		
		return output;
	}
}

public class OCNode {
	public var connectedTo : int[] = new int[0];

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
	}

 	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );
		var l : JSONObject = new JSONObject ( JSONObject.Type.ARRAY );

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
	}

	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

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
	}

	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

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
	}
	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "type", "OCGetFlag" );
		output.AddField ( "flag", flag );
		output.AddField ( "connectedTo", SerializeConnections () );
		
		return output;
	}
}
