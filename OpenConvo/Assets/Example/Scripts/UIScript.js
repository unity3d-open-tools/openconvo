#pragma strict

public class UIScript extends OGPage {
	public var lblName : OGLabel;
	public var lblLine : OGLabel;
	public var choices : OGListItem[];
	public var btnNext : OGButton;

	private var manager : OCManager;

	public function Start () {
		Clear ();
		manager = OCManager.GetInstance ();
		
	}

	public function SelectOption ( n : String ) {
		var i : int = int.Parse ( n );

		manager.SelectOption ( i );

		lblLine.gameObject.SetActive ( true );
		lblLine.text = choices[i].text;
	
		ClearChoices ();
	}

	public function Clear () {
		lblName.text = "";
		lblLine.text = "";
		lblLine.gameObject.SetActive ( false );
		ClearChoices ();
	}

	public function ClearChoices () {
		for ( var i : int = 0; i < choices.Length; i++ ) {
			choices[i].text = "";
			choices[i].isTicked = false;
			choices[i].isSelected = false;
			choices[i].gameObject.SetActive ( false );
		}
	}

	public function SetContent ( speaker : OCSpeaker, node : OCSpeak ) {
		Clear ();

		lblName.text = speaker.name;

		if ( !node.smalltalk && node.lines.Length > 1 ) {
			for ( var i : int = 0; i < choices.Length; i++ ) {
				if ( i < node.lines.Length ) {
					choices[i].gameObject.SetActive ( true );
					choices[i].text = node.lines[i].text;
				}
			}

		} else {
			lblLine.gameObject.SetActive ( true );
			lblLine.text = node.lines[node.index].text;

		}
	}

	public function Update () {
		btnNext.gameObject.SetActive ( lblLine.gameObject.activeSelf && lblLine.text != "" );
	}
}
