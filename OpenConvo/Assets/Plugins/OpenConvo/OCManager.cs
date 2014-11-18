using UnityEngine;
using System.Collections;

[System.Serializable]
public class OCSpeaker {
	public string name = "";
	public GameObject gameObject;

	public OCSpeaker ( string name, GameObject gameObject ) {
		this.name = name;
		this.gameObject = gameObject;
	}
}
	
public class OCManager : MonoBehaviour {
	public OCFlags flags = new OCFlags ();
	public OCQuests quests = new OCQuests ();
	public OCTree tree;
	public int currentNode;
	public OCEventHandler eventHandler;
	public OCSpeaker[] speakers = new OCSpeaker[0];

	private AudioSource currentAudioSource;
	private OCSpeaker speaker;

	public static OCManager instance;

	public static OCManager GetInstance () {
		return instance;
	}

	public int optionCount {
		get {
			OCNode node = tree.rootNodes[tree.currentRoot].GetNode ( currentNode );
		
			if ( node != null && node.speak != null && node.type == OCNodeType.Speak ) {
				return node.speak.lines.Length;
			
			} else {
				return 0;
			
			}
		}
	}

	public bool inConversation {
		get {
			return tree != null;
		}
	}

	public void SetSpeakerObjects ( GameObject[] speakerObjects ) {
		for ( int i = 0; i < speakers.Length; i++ ) {
			speakers[i].gameObject = speakerObjects [i];
		}
	}
	
	public void SetSpeakers ( string[] speakerNames, GameObject[] speakerObjects ) {
		speakers = new OCSpeaker [ speakerNames.Length ];
		
		for ( int i = 0; i < speakers.Length; i++ ) {
			speakers[i] = new OCSpeaker ( speakerNames[i], speakerObjects[i] );
		}
	}

	public void Awake () {
		instance = this;
	}

	public void Start () {
		if ( !eventHandler ) {
			GameObject go = GameObject.FindWithTag ( "EventHandler" );

			if ( go ) {
				eventHandler = go.GetComponentInChildren< OCEventHandler > ();
			}
		}
	}

	public void EndConversation () {
		EndConversation ( true );
	}

	public void EndConversation ( bool stopAudio ) {
		if ( stopAudio && currentAudioSource ) {
			currentAudioSource.Stop ();
		}
	
		foreach ( OCSpeaker s in speakers ) {
			if ( s.gameObject ) {
				s.gameObject.SendMessage ( "OnConversationEnd", SendMessageOptions.DontRequireReceiver );
			}
		}

		tree = null;
		currentAudioSource = null;
		
		if ( eventHandler ) {
			eventHandler.OnConversationEnd ();
		}
	}

	private IEnumerator PlayLineAudio ( OCNode node ) {
		// Make sure no other conversation audio is playing
		if ( currentAudioSource ) {
			currentAudioSource.Stop ();
			currentAudioSource = null;
		}

		// With audio
		if ( speaker.gameObject.audio && node.speak.lines[node.speak.index].audio ) {
			speaker.gameObject.audio.clip = node.speak.lines[node.speak.index].audio;
			speaker.gameObject.audio.loop = false;
			speaker.gameObject.audio.Play ();
			currentAudioSource = speaker.gameObject.audio;
	
			// Wait for speech duration
			float duration = speaker.gameObject.audio.clip.length;
			yield return new WaitForSeconds ( duration );
			
			// If we already continued manually, or the conversation has ended, abort
			if ( node.id == currentNode && tree != null ) {
				yield return new WaitForSeconds ( 0.5f );
				NextNode ( node.speak.index );
			}

		// Without audio
		} else {
			// For smalltalk, estimate the duration of the sentence
			if ( node.speak.smalltalk ) {
				float words = node.speak.lines[node.speak.index].text.Split ( " "[0] ).Length;
				float wordsPerMinute = 130;
				yield return new WaitForSeconds ( ( words / wordsPerMinute ) * 60f );
				NextNode ();

			} else {
				yield return null;
			
			}

		}
		
	}

	public void DisplayNode () {
		OCNode node = tree.rootNodes[tree.currentRoot].GetNode ( currentNode );
		bool wait = false;
		bool exit = false;
		int nextNode = 0;

		switch ( node.type ) {
			case OCNodeType.Jump:
				tree.currentRoot = node.jump.rootNode;
				nextNode = tree.rootNodes[tree.currentRoot].firstNode;
				break;

			case OCNodeType.Speak:
				speaker = speakers [ node.speak.speaker ];
				wait = true;
				break;

			case OCNodeType.Event:
				// Send the event message to the target object
				if ( node.evt.obj != null && node.evt.eventToTarget ) {
					if ( !string.IsNullOrEmpty ( node.evt.argument ) ) {
						node.evt.obj.SendMessage ( node.evt.message, node.evt.argument, SendMessageOptions.DontRequireReceiver );

					} else {
						node.evt.obj.SendMessage ( node.evt.message, tree, SendMessageOptions.DontRequireReceiver );
					
					}

				// Send the message to the event handler
				} else if ( eventHandler ) {
					if ( !string.IsNullOrEmpty ( node.evt.argument ) ) {
						eventHandler.Event ( node.evt.message, node.evt.argument );

					} else if ( node.evt.obj != null ) {
						eventHandler.Event ( node.evt.message, node.evt.obj );

					} else {
						eventHandler.Event ( node.evt.message, tree );
					
					}

				}

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
			
			case OCNodeType.SetQuest:
				OCQuests.Quest quest = quests.GetUserQuest ( node.setQuest.quest );
			       	
				if ( quest == null ) {
					quest = quests.GetPotentialQuest ( node.setQuest.quest );

					if ( quest != null ) {
						quests.AddUserQuest ( quest );
					}
				}

				if ( quest != null ) {
					OCQuests.Objective objective = quest.objectives [ node.setQuest.objective ];
					objective.completed = node.setQuest.completed;
				
				} else {
					Debug.LogWarning ( "OCManager | Quest is null!" );

				}

				nextNode = node.connectedTo[0];
				break;
			
			case OCNodeType.GetQuest:
				quest = quests.GetUserQuest ( node.getQuest.quest );
				
				if ( ( !node.getQuest.completed && quest != null ) || ( quest != null && node.getQuest.objective < quest.objectives.Length && quest.objectives[node.getQuest.objective].completed ) ) {
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

		// Meta nodes
		if ( exit ) {
			EndConversation ();

		} else if ( !wait ) {
			currentNode = nextNode;
			DisplayNode ();
		
		// OCSpeak nodes
		} else if ( node != null && node.speak != null ) {
			eventHandler.OnSetSpeaker ( speaker, node.speak );
			
			if ( !node.speak.choice ) {
				StartCoroutine ( PlayLineAudio ( node ) );
				
				if ( node.speak.smalltalk ) {
					if ( node.speak.index < node.speak.lines.Length - 1 ) {
						node.speak.index++;
					}
				}
			}
		}
	}

	public void SelectOption ( string n ) {
		SelectOption ( int.Parse ( n ) );
	}

	public void SelectOption ( int i ) {
		eventHandler.OnSelectOption ( i );
		
		OCNode node = tree.rootNodes[tree.currentRoot].GetNode ( currentNode );
		node.speak.index = i;

		StartCoroutine ( PlayLineAudio ( node ) );
	}

	public void NextNode () {
		OCRootNode rootNode = tree.rootNodes[tree.currentRoot];
		OCNode node = rootNode.GetNode ( currentNode );
		
		if ( node.speak != null && node.speak.choice ) {
			NextNode ( node.speak.index );
		
		} else {
			NextNode ( 0 );

		}
	}

	public void NextNode ( int i ) {
		if ( tree == null ) { return; }

		OCRootNode rootNode = tree.rootNodes[tree.currentRoot];
		OCNode node = rootNode.GetNode ( currentNode );

		// Force output 0 on smalltalk nodes, just in case
		if ( node.speak != null && node.speak.smalltalk ) {
			i = 0;
		}

		// Check for range
		if ( i < node.connectedTo.Length ) {
			currentNode = node.connectedTo[i];
			DisplayNode ();
		
		} else {
			Debug.LogError ( "OCManager | Node index '" + i + "' out of range (0-" + ( node.connectedTo.Length - 1 ) + ")" );
			EndConversation ();
				
		}
	}

	public void StartConversation ( OCTree tree ) {
		if ( !this.tree && tree && tree.rootNodes.Length > 0 ) {
			this.tree = tree;

			currentNode = tree.rootNodes[tree.currentRoot].firstNode;
			
			eventHandler.OnConversationStart ( tree );

			DisplayNode ();
		}
	}
}
