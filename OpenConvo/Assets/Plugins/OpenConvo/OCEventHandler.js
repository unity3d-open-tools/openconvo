#pragma strict

public class OCEventHandler extends MonoBehaviour {
	public function OnConversationEnd () {}
	public function OnConversationStart ( tree : OCTree ) {}
	public function OnObjectiveCompleted ( quest : OCQuests.Quest, i : int ) {}
	public function OnSetSpeaker ( speaker : OCSpeaker, node : OCSpeak ) {}
	public function OnSelectOption ( i : int ) {}
	
	public function Event ( message : String ) {
		this.gameObject.SendMessage ( message, SendMessageOptions.DontRequireReceiver );
	}

	public function Event ( message : String, argument : String ) {
		this.gameObject.SendMessage ( message, argument, SendMessageOptions.DontRequireReceiver );
	}

	public function Event ( message : String, object : Object ) {
		this.gameObject.SendMessage ( message, object, SendMessageOptions.DontRequireReceiver );
	}
}
