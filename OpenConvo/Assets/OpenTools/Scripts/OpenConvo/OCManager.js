#pragma strict

public class OCManager extends MonoBehaviour {
	public var flags : OCFlags = new OCFlags ();
	public var tree : OCTree;
	public var speakers : GameObject[] = new GameObject [0];
	public var currentNode : int;

	private var speaker : GameObject;

	public static var instance : OCManager;

	public static function GetInstance () : OCManager {
		return instance;
	}

	public function Start () {
		instance = this;
	}

	public function Exit () {
		tree = null;
		speakers = new GameObject[0];
		currentNode = -1;
	}

	public function DisplayNode () {
		var node : OCNode = tree.rootNodes[tree.currentRoot].nodes [ currentNode ];
		var speak : OCSpeak = node as OCSpeak;
		var event : OCEvent = node as OCEvent;
		var jump : OCJump = node as OCJump;
		var setFlag : OCSetFlag = node as OCSetFlag;
		var getFlag : OCGetFlag = node as OCGetFlag;
		var wait : boolean = false;
		var nextNode : int;

		if ( jump ) {
			tree.currentRoot = jump.rootNode;
			nextNode = tree.rootNodes[tree.currentRoot].firstNode;

		} else if ( speak ) {
			speaker = speakers [ speak.speaker ];
			wait = true;

			tree.eventHandler.SendMessage ( "SetSpeaker", speaker );

		} else if ( event ) {
			tree.eventHandler.SendMessage ( event.message, event.argument, SendMessageOptions.DontRequireReceiver );

			nextNode = event.connectedTo[0];

		} else if ( setFlag ) {
			flags.Set ( setFlag.flag, setFlag.b );
		
			nextNode = setFlag.connectedTo[0];

		} else if ( getFlag ) {
			if ( flags.Get ( getFlag.flag ) ) {
				nextNode = getFlag.connectedTo[1];

			} else {
				nextNode = getFlag.connectedTo[0];

			}

		}

		if ( !wait ) {
			currentNode = nextNode;
			DisplayNode ();
		}
	}

	public function PickOption ( i : int ) {
		currentNode = tree.rootNodes[tree.currentRoot].nodes[currentNode].connectedTo[i];
		DisplayNode ();
	}

	public function NextNode () {
		currentNode = tree.rootNodes[tree.currentRoot].nodes[currentNode].connectedTo[0];
		DisplayNode ();
	}

	public function StartConversation ( tree : OCTree, speakers : GameObject[] ) {
		if ( tree && tree.rootNodes.Length > 0 ) {
			tree.eventHandler.SendMessage ( "StartConversation" );
			
			this.tree = tree;
			this.speakers = speakers;

			currentNode = tree.rootNodes[tree.currentRoot].firstNode;
			
			DisplayNode ();
		}
	}
}
