using UnityEngine;
using System.Collections;

public class OCEventHandler : MonoBehaviour {
	public virtual void OnConversationEnd () {}
	public virtual void OnConversationStart ( OCTree tree ) {}
	public virtual void OnObjectiveCompleted ( OCQuests.Quest quest, int i ) {}
	public virtual void OnSetSpeaker ( OCSpeaker speaker, OCSpeak node ) {}
	public virtual void OnSelectOption ( int i ) {}
	
	public void Event ( string message ) {
		this.gameObject.SendMessage ( message, SendMessageOptions.DontRequireReceiver );
	}

	public void Event ( string message, string argument ) {
		this.gameObject.SendMessage ( message, argument, SendMessageOptions.DontRequireReceiver );
	}

	public void Event ( string message, Object obj ) {
		this.gameObject.SendMessage ( message, obj, SendMessageOptions.DontRequireReceiver );
	}
}
