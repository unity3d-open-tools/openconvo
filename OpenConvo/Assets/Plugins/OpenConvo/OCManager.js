#pragma strict

public class OCConversationManager {
	public var tree : OCTree;
	public var speakers : GameObject[] = new GameObject [0];
	public var currentNode : OCNode;

	public var passive : boolean = false;

	public function Exit () {
		tree = null;
		speakers = new GameObject[0];
		currentNode = null;
	}

	public function DisplayNode () {
		var type : System.Type = currentNode.GetType ();

		
	}

	public function StartConversation ( tree : OCTree, speakers : GameObject[] ) {
		if ( tree && tree.rootNodes.Length > 0 ) {
			this.tree = tree;
			this.speakers = speakers;

			currentNode = tree.rootNodes[tree.currentRoot].connectedTo;
			this.passive = tree.rootNodes[tree.currentRoot].passive;
			
			DisplayNode ();
		}
	}
}
