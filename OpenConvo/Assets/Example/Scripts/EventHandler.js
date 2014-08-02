#pragma strict

public class EventHandler extends OCEventHandler {
	public var ui : UIScript;
	public var cloth : GameObject;
	public var balls : GameObject [];

	private var manager : OCManager;

	public function Start () {
		manager = this.GetComponent.< OCManager > ();
	}
	
	public function OnConversationEnd () {
		ui.Clear ();
	}
	
	public function OnConversationStart ( tree : OCTree ) {
		var spk : Speaker = tree.gameObject.GetComponent.< Speaker > ();
		
		manager.speakers = spk.speakers;
	}

	public function OnObjectiveCompleted ( quest : OCQuests.Quest, i : int ) {}
	
	public function OnSetSpeaker ( speaker : OCSpeaker, node : OCSpeak ) {
		var spk : Speaker = speaker.gameObject.GetComponent.< Speaker > ();
	
		spk.facing = manager.speakers[node.facing].gameObject;
	
		ui.SetContent ( speaker, node );
	}
	
	public function OnSelectOption ( i : int ) {}

	public function ActivateCloth () {
		cloth.SetActive ( true );
	}
	
	public function DeactivateCloth () {
		cloth.SetActive ( false );
	}

	public function ActivateBalls () {
		for ( var ball : GameObject in balls ) {
			ball.SetActive ( true );
		}
	}
}
