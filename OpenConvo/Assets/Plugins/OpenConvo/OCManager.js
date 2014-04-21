#pragma strict

public class OCManager extends MonoBehaviour {
	public var flags : OCFlags = new OCFlags ();
	public var tree : OCTree;
	public var speakers : GameObject[] = new GameObject [0];
	public var currentNode : int;
	public var eventHandler : GameObject;

	private var speaker : GameObject;

	public static var instance : OCManager;

	public static function GetInstance () : OCManager {
		return instance;
	}

	public function Start () {
		instance = this;
	}

	public function EndConversation () {
		tree = null;
		speakers = new GameObject[0];
		
		eventHandler.SendMessage ( "OnConversationEnd", speaker );
	}

	public function DisplayNode () {
		var node : OCNode = tree.rootNodes[tree.currentRoot].nodes [ currentNode ];
		var wait : boolean = false;
		var exit : boolean = false;
		var nextNode : int;

		if ( !node ) {
			exit = true;

		} else if ( node.jump ) {
			tree.currentRoot = node.jump.rootNode;
			nextNode = tree.rootNodes[tree.currentRoot].firstNode;

		} else if ( node.speak ) {
			speaker = tree.speakers [ node.speak.speaker ];
			wait = true;

			eventHandler.SendMessage ( "OnSetSpeaker", speaker );

		} else if ( node.event ) {
			eventHandler.SendMessage ( node.event.message, node.event.argument, SendMessageOptions.DontRequireReceiver );

			nextNode = node.connectedTo[0];

		} else if ( node.setFlag ) {
			flags.Set ( node.setFlag.flag, node.setFlag.b );
		
			nextNode = node.connectedTo[0];

		} else if ( node.getFlag ) {
			if ( flags.Get ( node.getFlag.flag ) ) {
				nextNode = node.connectedTo[1];

			} else {
				nextNode = node.connectedTo[0];

			}

		} else if ( node.end ) {
			tree.currentRoot = node.end.rootNode;
			exit = true;

		}

		if ( exit ) {
			EndConversation ();

		} else if ( !wait ) {
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
			eventHandler.SendMessage ( "OnConversationStart" );
			
			this.tree = tree;
			this.speakers = speakers;

			currentNode = tree.rootNodes[tree.currentRoot].firstNode;
			
			DisplayNode ();
		}
	}
}
