#pragma strict

public class OCTree extends MonoBehaviour {
	public var rootNodes : OCRootNode[];
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
	public var connectedTo : OCNode;

	public function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "auto", auto );
		output.AddField ( "passive", passive );
		output.AddField ( "connectedTo", connectedTo.Serialize () );
		
		return output;
	}
}

public class OCNode {
	public var connectedTo : OCNode[] = new OCNode[0];

	public function Serialize () : JSONObject {}
}

public class OCSpeak extends OCNode {
	public var speaker : int;
	public var lines : String[] = new String[1];

	function OCSpeak () {
		connectedTo = new OCNode[1];
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

		return output;
	}
}

public class OCEvent extends OCNode {
	public var message : String;
	public var argument : String;
 	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "type", "OCEvent" );
		output.AddField ( "message", message );
		output.AddField ( "argument", argument );
		
		return output;
	}
}

public class OCJump extends OCNode {
	public var rootNode : int;
	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "type", "OCJump" );
		output.AddField ( "rootNode", rootNode );
		
		return output;
	}
}

public class OCSetFlag extends OCNode {
	public var flag : String;
	public var b : boolean;
	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "type", "OCSetFlag" );
		output.AddField ( "flag", flag );
		output.AddField ( "boolean", b );
		
		return output;
	}
}

public class OCGetFlag extends OCNode {
	public var flag : String;
	
	override function Serialize () : JSONObject {
		var output : JSONObject = new JSONObject ( JSONObject.Type.OBJECT );

		output.AddField ( "type", "OCGetFlag" );
		output.AddField ( "flag", flag );
		
		return output;
	}
}
