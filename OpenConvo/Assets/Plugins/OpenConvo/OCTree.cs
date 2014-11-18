using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public enum OCNodeType {
	Speak,
	Event,
	Jump,
	SetFlag,
	GetFlag,
	SetQuest,
	GetQuest,
	End
}

public class OCTree : MonoBehaviour {
	public OCRootNode[] rootNodes = new OCRootNode[0];
	public int currentRoot;
	public string[] speakers = new string[0];

	private static System.Random random = new System.Random ();

	public static int CreateID () {
		return random.Next ( 10000, 99999 );
	}

	public string[] rootNodeStrings {
		get {
			string[] strings = new string [ rootNodes.Length ];
			
			for ( int i = 0; i < strings.Length; i++ ) {
				strings[i] = i.ToString ();
			}

			return strings;
		}
	}

	public void CleanUp () {
		for ( int i = 0; i < rootNodes.Length; i++ ) {
			List< OCNode > tmp = new List< OCNode > ( rootNodes[i].nodes );

			for ( int n = tmp.Count - 1; n >= 0; n-- ) {
				if ( tmp[n].id < 1 ) {
					tmp.RemoveAt ( n );
				}
			}

			rootNodes[i].nodes = tmp.ToArray ();
		}
	}	

	public void MoveRoot ( int from, int to ) {
		if ( to >= 0 && to < rootNodes.Length ) {
			OCRootNode fromRootNode = rootNodes[from];
			OCRootNode toRootNode = rootNodes[to];
			
			rootNodes[to] = fromRootNode;
			rootNodes[from] = toRootNode;
		}
	}

	public void AddSpeaker () {
		List< string > tmpSpk = new List< string > ( speakers );

		tmpSpk.Add ( "" );

		speakers = tmpSpk.ToArray ();
	}

	public void RemoveSpeaker ( int i ) {
		List< string > tmpSpk = new List< string > ( speakers );

		tmpSpk.RemoveAt ( i );

		speakers = tmpSpk.ToArray ();
	}

	public void AddRootNode () {
		List< OCRootNode > tempNodes = new List< OCRootNode > ( rootNodes );

		tempNodes.Add ( new OCRootNode () );

		rootNodes = tempNodes.ToArray ();
	}
	
	public void RemoveRootNode ( int i ) {
		if ( rootNodes.Length > 1 ) {
			List< OCRootNode > tempNodes = new List< OCRootNode > ( rootNodes );

			tempNodes.RemoveAt ( i );

			rootNodes = tempNodes.ToArray ();
		}
	}

	public bool CurrentRootHasTag ( string tag ) {
		foreach ( string t in rootNodes[currentRoot].tags ) {
			if ( t == tag ) {
				return true;
			}
		}

		return false;
	}
}

[System.Serializable]
public class OCRootNode {
	public string[] tags = new string[0];
	public int firstNode;
	public OCNode[] nodes = new OCNode[0];

	public void ClearNodes () {
		nodes = new OCNode [0];
	}

	public OCNode AddNode () {
		List< OCNode > tmpNodes = new List< OCNode > ( nodes );
		OCNode newNode = new OCNode ();
		newNode.SetType ( OCNodeType.Speak, true );

		tmpNodes.Add ( newNode );

		nodes = tmpNodes.ToArray ();

		return newNode;
	}

	public void AddFirstNode () {
		OCNode newNode = AddNode ();

		firstNode = newNode.id;
	}

	public OCNode GetFirstNode () {
		return GetNode ( firstNode );
	}

	public void RemoveNode ( int id ) {
		List< OCNode > tmpNodes = new List< OCNode > ( nodes );
		int removeIndex = -1;
		int i = 0;

		// Find node
		for ( i = 0; i < tmpNodes.Count; i++ ) {
			if ( tmpNodes[i].id == id ) {
				removeIndex = i;
				break;
			}
		}

		// Fix broken links
		for ( i = 0; i < tmpNodes.Count; i++ ) {
			for ( int c = 0; c < tmpNodes[i].connectedTo.Length; c++ ) {
				if ( tmpNodes[i].connectedTo[c] == id ) {
					if ( removeIndex > 0 && tmpNodes[removeIndex].connectedTo.Length > 0 ) {
						tmpNodes[i].connectedTo[c] = tmpNodes[removeIndex].connectedTo[0];
					}
				}
			}
		}

		// Remove node
		if ( removeIndex > 0 ) {
			tmpNodes.RemoveAt ( removeIndex );
		}

		nodes = tmpNodes.ToArray ();
	}

	public OCNode GetNode ( int id ) {
		for ( int i = 0; i < nodes.Length; i++ ) {
			if ( nodes[i].id == id ) {
				return nodes[i];
			}
		}

		return null;
	}

	public void RemoveTag ( string id ) {
		List< string > tmpTags = new List< string > ( tags );
		
		if ( tmpTags.Contains ( id ) ) {
			tmpTags.Remove ( id );
			tags = tmpTags.ToArray ();
		}
	}

	public void SetTag ( string id ) {
		List< string > tmpTags = new List< string > ( tags );
		
		if ( !tmpTags.Contains ( id ) ) {
			tmpTags.Add ( id );
			tags = tmpTags.ToArray ();
		}
	}
	
	public bool GetTag ( string id ) {
		for ( int i = 0; i < tags.Length; i++ ) {
			if ( tags[i] == id ) {
				return true;
			}
		}

		return false;
	}
}

[System.Serializable]
public class OCNode {
	public int[] connectedTo = new int[0];
	public int id;
	public OCNodeType type;

	public OCSpeak speak;
	public OCEvent evt;
	public OCJump jump;
	public OCSetFlag setFlag;
	public OCGetFlag getFlag;
	public OCSetQuest setQuest;
	public OCGetQuest getQuest;
	public OCEnd end;

	public OCNode () {
		id = OCTree.CreateID ();
	}

	public void SetConnection ( int i, int id ) {
		if ( i >= connectedTo.Length ) {
			SetOutputAmount ( i + 1 );
		}

		connectedTo[i] = id;
	}

	public void SetOutputAmount ( int n ) {
		if ( n < 1 ) {
			connectedTo = new int[0];
		} else {
			List< int > tmpConnect = new List< int > ( connectedTo );
			
			int i = 0;

			if ( n > connectedTo.Length ) {
				for ( i = connectedTo.Length; i < n; i++ ) {
					tmpConnect.Add ( 0 );
				}

				connectedTo = tmpConnect.ToArray ();
			
			} else if ( n < connectedTo.Length ) {
				for ( i = connectedTo.Length - 1; i >= n; i-- ) {
					tmpConnect.RemoveAt ( i );
				}
				
				connectedTo = tmpConnect.ToArray ();
				
			}
		}
	}

	public void Reset () {
		speak = null;
		evt = null;
		jump = null;
		setFlag = null;
		getFlag = null;
		end = null;
	}

	public void SetType ( string str ) {
		int type = 0;
		string[] names = System.Enum.GetNames ( typeof(OCNodeType) );

		for ( int i = 0; i < names.Length; i++ ) {
			if ( names[i] == str ) {
				type = i;
			}
		}

		SetType ( (OCNodeType)type );
	}

	public void SetType ( OCNodeType val ) {
		SetType ( val, false );
	}

	public void SetType ( OCNodeType val, bool force ) {
		if ( val != type || force ) {
			type = val;
			
			Reset ();

			switch ( type ) {
				case OCNodeType.Speak:
					speak = new OCSpeak ();
					SetOutputAmount ( 1 );
					break;
				
				case OCNodeType.Event:
					evt = new OCEvent ();
					SetOutputAmount ( 1 );
					break;
				
				case OCNodeType.Jump:
					jump = new OCJump ();
					SetOutputAmount ( 0 );
					break;
				
				case OCNodeType.SetFlag:
					setFlag = new OCSetFlag ();
					SetOutputAmount ( 1 );
					break;
				
				case OCNodeType.GetFlag:
					getFlag = new OCGetFlag ();
					SetOutputAmount ( 2 );
					break;
				
				case OCNodeType.SetQuest:
					setQuest = new OCSetQuest ();
					SetOutputAmount ( 1 );
					break;

				case OCNodeType.GetQuest:
					getQuest = new OCGetQuest ();
					SetOutputAmount ( 2 );
					break;

				case OCNodeType.End:
					end = new OCEnd ();
					SetOutputAmount ( 0 );	
					break;
			}
		}
	}
}

[System.Serializable]
public class OCSpeak {
	[System.Serializable]
	public class Line {
		public string text;
		public AudioClip audio;
		public string animation;
		public int facing = 0;
		
		public Line ( string text, AudioClip audio, string animation, int facing ) {
			this.text = text;
			this.audio = audio;
			this.animation = animation;
			this.facing = facing;
		}
	}
	
	public int speaker;
	public Line[] lines = new Line[0];
	public bool smalltalk = false;
	public int index = 0;

	public OCSpeak () {
		lines = new Line [] { new Line ( "", null, "", 0 ) };
	}

	public int facing {
		get {
			return lines[index].facing;
		}
	}

	public bool choice {
		get {
			return !smalltalk && lines.Length > 1;
		}
	}

	public void RemoveLine ( int i ) {
		List< Line > tmp = new List< Line > ( lines );

		tmp.RemoveAt ( i );

		lines = tmp.ToArray ();
	}

	public void AddLine () {
		List< Line > tmp = new List< Line > ( lines );

		tmp.Add ( new Line ( "", null, "", 0 ) );

		lines = tmp.ToArray ();
	}
}

[System.Serializable]
public class OCEvent {
	public string message;
	public string argument;
	public GameObject obj;
	public string objectPath;
	public string objectId;
	public bool eventToTarget = false;
}

[System.Serializable]
public class OCJump {
	public int rootNode;
}

[System.Serializable]
public class OCEnd {
	public int rootNode;
}

[System.Serializable]
public class OCSetFlag {
	public string flag;
	public bool b;
}

[System.Serializable]
public class OCGetFlag {
	public string flag;
}

[System.Serializable]
public class OCSetQuest {
	public string quest;
	public int objective;
	public bool completed;
}

[System.Serializable]
public class OCGetQuest {
	public string quest;
	public int objective;
	public bool completed;
}
