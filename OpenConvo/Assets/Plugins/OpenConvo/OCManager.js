#pragma strict

public class OCManager extends MonoBehaviour {
	public var flags : OCFlags = new OCFlags ();
	public var tree : OCTree;
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
		
		eventHandler.SendMessage ( "OnConversationEnd", speaker );
	}

	public function DisplayNode () {
		var node : OCNode = tree.rootNodes[tree.currentRoot].GetNode ( currentNode );
		var wait : boolean = false;
		var exit : boolean = false;
		var nextNode : int;

		switch ( node.type ) {
			case OCNodeType.Jump:
				tree.currentRoot = node.jump.rootNode;
				nextNode = tree.rootNodes[tree.currentRoot].firstNode;
				break;

			case OCNodeType.Speak:
				speaker = tree.speakers [ node.speak.speaker ];
				wait = true;
				break;

			case OCNodeType.Event:
				eventHandler.SendMessage ( node.event.message, node.event.argument, SendMessageOptions.DontRequireReceiver );

				nextNode = node.connectedTo[0];
				break;

			case OCNodeType.SetFlag:
				flags.Set ( node.setFlag.flag, node.setFlag.b );
			
				nextNode = node.connectedTo[0];
				break;

			case OCNodeType.GetFlag:
				if ( flags.Get ( node.getFlag.flag ) ) {
					nextNode = node.connectedTo[1];

				} else {
					nextNode = node.connectedTo[0];

				}
				break;

			case OCNodeType.End:
				tree.currentRoot = node.end.rootNode;
				exit = true;
				break;
		}

		if ( exit ) {
			EndConversation ();

		} else if ( !wait ) {
			currentNode = nextNode;
			DisplayNode ();
		
		} else if ( node && node.speak ) {
			eventHandler.SendMessage ( "OnSetLines", node.speak.lines );
			eventHandler.SendMessage ( "OnSetSpeaker", speaker );
		
		}
	}

	public function SelectOption ( i : int ) {
		currentNode = tree.rootNodes[tree.currentRoot].GetNode(currentNode).connectedTo[i];
		DisplayNode ();
	}

	public function NextNode () {
		currentNode = tree.rootNodes[tree.currentRoot].GetNode(currentNode).connectedTo[0];
		DisplayNode ();
	}

	public function StartConversation ( tree : OCTree ) {
		if ( !this.tree && tree && tree.rootNodes.Length > 0 ) {
			eventHandler.SendMessage ( "OnConversationStart" );
			
			this.tree = tree;

			currentNode = tree.rootNodes[tree.currentRoot].firstNode;
			
			DisplayNode ();
		}
	}
}
