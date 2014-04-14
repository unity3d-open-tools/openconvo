#pragma strict

public class OCTree {
	public var rootNodes : OCRootNode[];
	public var currentRoot : int;
}

public class OCRootNode {
	public var auto : boolean = false;
	public var passive : boolean = false;
	public var connectedTo : OCNode;
}

public class OCNode {
	public var rootIndex : int = 0;
	public var nodeIndex : int = 0;
	
	public var connectedTo : OCNode[] = new OCNode[0];
}

public class OCSpeak extends OCNode {
	public var speaker : int;
	public var lines : String[] = new String[1];
}

public class OCAction extends OCNode {
	public var receiver : GameObject;
	public var message : String;
	public var argument : String;
}

public class OCJump extends OCNode {
	public var target : int;
}

public class OCConsequence extends OCNode {
	public var flag : String;
	public var b : boolean;
}

public class OCCondition extends OCNode {
	public var flag : String;
}
