#pragma strict

public class ExampleEvents extends MonoBehaviour {
	public var manager : OCManager;
	public var nextButton : GameObject;
	public var options : OGListItem[] = new OGListItem[0];
	public var line : OGLabel;
	public var actorName : OGLabel;
	public var convoUI : GameObject;
	public var cam : CameraScript;
	public var eventTest : GameObject;

	public function Start () {
		convoUI.SetActive ( false );
	}

	public function Update () {
		if ( cam.target ) {
			var uiPos : Vector3 = cam.camera.WorldToScreenPoint ( cam.target.position );
		
			convoUI.transform.position = uiPos;
		}
	}
	
	// Messages sent by the OCManager by default
	public function OnConversationStart () {
		convoUI.SetActive ( true );
	}

	public function OnConversationEnd () {
		convoUI.SetActive ( false );
		cam.target = null;
	}

	public function SelectOption ( n : String ) {
		var i : int = int.Parse ( n );

		manager.SelectOption ( i );
	}

	public function OnSetLines ( lines : String[] ) {
		if ( lines.Length > 1 ) {
			for ( var i : int = 0; i < lines.Length; i++ ) {
				options[i].gameObject.SetActive ( true );
				options[i].text = lines[i];
				options[i].isTicked = false;
			}
			
			line.text = "";
			line.gameObject.SetActive ( false );
			nextButton.SetActive ( false );

		} else {
			for ( i = 0; i < options.Length; i++ ) {
				options[i].text = "";
				options[i].gameObject.SetActive ( false );
			}
			
			line.gameObject.SetActive ( true );
			line.text = lines[0];
			nextButton.SetActive ( true );

		}
	}

	public function OnSetSpeaker ( speaker : GameObject ) {
		cam.target = speaker.transform;

		actorName.text = speaker.name;
	}

	// Events sent from OCManager as called by the user
	public function TestEvent ( action : String ) {
		eventTest.SetActive ( action == "appear" );
	}
}
