#pragma strict

public class OCSpeaker {
	public var name : String = "";
	public var gameObject : GameObject;

	function OCSpeaker ( name : String, gameObject : GameObject ) {
		this.name = name;
		this.gameObject = gameObject;
	}
}
	
public class OCManager extends MonoBehaviour {
	public var flags : OCFlags = new OCFlags ();
	public var quests : OCQuests = new OCQuests ();
	public var tree : OCTree;
	public var currentNode : int;
	public var eventHandler : OCEventHandler;
	public var speakers : OCSpeaker [] = new OCSpeaker [0];

	private var currentAudioSource : AudioSource;
	private var speaker : OCSpeaker;

	public static var instance : OCManager;

	public static function GetInstance () : OCManager {
		return instance;
	}

	public function get optionCount () : int {
		var node : OCNode = tree.rootNodes[tree.currentRoot].GetNode ( currentNode );
		
		if ( node && node.speak && node.type == OCNodeType.Speak ) {
			return node.speak.lines.Length;
		
		} else {
			return 0;
		
		}
	}

	public function get inConversation () : boolean {
		return tree != null;
	}

	public function SetSpeakerObjects ( speakerObjects : GameObject [] ) {
		for ( var i : int = 0; i < speakers.Length; i++ ) {
			speakers[i].gameObject = speakerObjects [i];
		}
	}
	
	public function SetSpeakers ( speakerNames : String [], speakerObjects : GameObject [] ) {
		speakers = new OCSpeaker [ speakerNames.Length ];
		
		for ( var i : int = 0; i < speakers.Length; i++ ) {
			speakers[i] = new OCSpeaker ( speakerNames[i], speakerObjects[i] );
		}
	}

	public function Awake () {
		instance = this;
	}

	public function Start () {
		if ( !eventHandler ) {
			var go : GameObject = GameObject.FindWithTag ( "EventHandler" );

			if ( go ) {
				eventHandler = go.GetComponentInChildren.< OCEventHandler > ();
			}
		}
	}

	public function EndConversation () {
		EndConversation ( true );
	}

	public function EndConversation ( stopAudio : boolean ) {
		if ( stopAudio && currentAudioSource ) {
			currentAudioSource.Stop ();
		}
	
		for ( var s : OCSpeaker in speakers ) {
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

	private function PlayLineAudio ( node : OCNode ) : IEnumerator {
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
			var duration : float = speaker.gameObject.audio.clip.length;
			yield WaitForSeconds ( duration );
			
			// If we already continued manually, or the conversation has ended, abort
			if ( node.id == currentNode && tree != null ) {
				yield WaitForSeconds ( 0.5 );
				NextNode ( node.speak.index );
			}

		// Without audio
		} else {
			// For smalltalk, estimate the duration of the sentence
			if ( node.speak.smalltalk ) {
				var words : float = node.speak.lines[node.speak.index].text.Split ( " "[0] ).Length;
				var wordsPerMinute : float = 130;
				yield WaitForSeconds ( ( words / wordsPerMinute ) * 60 );
				NextNode ();

			} else {
				yield null;
			
			}

		}
		
	}

	public function DisplayNode () : void {
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
				speaker = speakers [ node.speak.speaker ];
				wait = true;
				break;

			case OCNodeType.Event:
				// Send the event message to the target object
				if ( node.event.object != null && node.event.eventToTarget ) {
					if ( !String.IsNullOrEmpty ( node.event.argument ) ) {
						node.event.object.SendMessage ( node.event.message, node.event.argument, SendMessageOptions.DontRequireReceiver );

					} else {
						node.event.object.SendMessage ( node.event.message, tree, SendMessageOptions.DontRequireReceiver );
					
					}

				// Send the message to the event handler
				} else if ( eventHandler ) {
					if ( !String.IsNullOrEmpty ( node.event.argument ) ) {
						eventHandler.Event ( node.event.message, node.event.argument );

					} else if ( node.event.object != null ) {
						eventHandler.Event ( node.event.message, node.event.object );

					} else {
						eventHandler.Event ( node.event.message, tree );
					
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
				var quest : OCQuests.Quest = quests.GetUserQuest ( node.setQuest.quest );
			       	
				if ( !quest ) {
					quest = quests.GetPotentialQuest ( node.setQuest.quest );

					if ( quest ) {
						quests.AddUserQuest ( quest );
					}
				}

				if ( quest ) {
					var objective : OCQuests.Objective = quest.objectives [ node.setQuest.objective ];
					objective.completed = node.setQuest.completed;
				
				} else {
					Debug.LogWarning ( "OCManager | Quest is null!" );

				}

				nextNode = node.connectedTo[0];
				break;
			
			case OCNodeType.GetQuest:
				quest = quests.GetUserQuest ( node.getQuest.quest );
				
				if ( ( !node.getQuest.completed && quest ) || ( quest && node.getQuest.objective < quest.objectives.Length && quest.objectives[node.getQuest.objective].completed ) ) {
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
		} else if ( node && node.speak ) {
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

	public function SelectOption ( n : String ) {
		SelectOption ( int.Parse ( n ) );
	}

	public function SelectOption ( i : int ) {
		eventHandler.OnSelectOption ( i );
		
		var node : OCNode = tree.rootNodes[tree.currentRoot].GetNode ( currentNode );
		node.speak.index = i;

		StartCoroutine ( PlayLineAudio ( node ) );
	}

	public function NextNode () {
		var rootNode : OCRootNode = tree.rootNodes[tree.currentRoot];
		var node : OCNode = rootNode.GetNode ( currentNode );
		
		if ( node.speak && node.speak.choice ) {
			NextNode ( node.speak.index );
		
		} else {
			NextNode ( 0 );

		}
	}

	public function NextNode ( i : int ) {
		if ( tree == null ) { return; }

		var rootNode : OCRootNode = tree.rootNodes[tree.currentRoot];
		var node : OCNode = rootNode.GetNode ( currentNode );

		// Force output 0 on smalltalk nodes, just in case
		if ( node.speak && node.speak.smalltalk ) {
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

	public function StartConversation ( tree : OCTree ) {
		if ( !this.tree && tree && tree.rootNodes.Length > 0 ) {
			this.tree = tree;

			currentNode = tree.rootNodes[tree.currentRoot].firstNode;
			
			eventHandler.OnConversationStart ( tree );

			DisplayNode ();
		}
	}
}
