using UnityEngine;
using System.Collections;

using System.Collections.Generic;

[System.Serializable]
public class OCQuests {
	[System.Serializable]
	public class Giver {
		public string name;
		public Texture2D portrait;

		public Giver ( string name, Texture2D portrait ) {
			this.name = name;
			this.portrait = portrait;
		}
	}

	[System.Serializable]
	public class Objective {
		public string description;
		public int progress = 0;
		public int goal = 1;

		public Objective ( string description, int goal ) {
			if ( goal < 1 ) {
				goal = 1;
			}
			
			this.description = description;
			this.goal = goal;
		}	

		public bool completed {
			get {
				if ( progress > goal ) {
					progress = goal;
				}

				return progress == goal;
			}
			
			set {
				progress = (bool)value ? goal : 0;
			}
		}
	}
	
	[System.Serializable]
	public class Quest {
		public string title;
		public string description;
		public Objective[] objectives = new Objective[0];
		public int xp;
		public Giver giver;
		public Texture2D image;
		public bool side;

		public Quest () {
		
		}

		public Quest ( string title, string description, Objective[] objectives, int xp = 0, bool side = false, Giver giver = null, Texture2D image = null ) {
			this.title = title;
			this.description = description;
			this.objectives = objectives;
			this.xp = xp;
			this.side = side;
			this.giver = giver;
			this.image = image;
		}

		public bool completed {
			get {
				int completedObjectives = 0;

				for ( int i = 0; i < objectives.Length; i++ ) {
					if ( objectives[i].completed ) {
						completedObjectives++;
					}
				}

				return objectives.Length > 0 && completedObjectives == objectives.Length;
			}

			set {
				for ( int i = 0; i < objectives.Length; i++ ) {
					objectives[i].completed = (bool)value;
				}
			}
		}

		public void ProgressObjective ( string description, int amount ) {
			for ( int i = 0; i < objectives.Length; i++ ) {
				if ( description == objectives[i].description ) {
					ProgressObjective ( i, amount );
					break;
				}
			}
		}

		public void ProgressObjective ( int i, int amount ) {
			if ( i >= 0 && i < objectives.Length ) {
				objectives[i].progress += amount;

				if ( objectives[i].progress >= objectives[i].goal ) {
					CompleteObjective ( i );
				}
			}			
		}

		public void CompleteObjective ( int i ) {
			if ( i >= 0 && i < objectives.Length ) {
				objectives[i].completed = true;

				OCManager manager = OCManager.GetInstance();

				if ( manager ) {
					manager.eventHandler.OnObjectiveCompleted ( this, i );
				
				} else {
					Debug.LogError ( "OCManager not in scene!" );

				}
			}
		}

		public string [] GetObjectiveStrings ( int maxLength ) {
			string[] strings = new string [ objectives.Length ];

			for ( int i = 0; i < objectives.Length; i++ ) {
				strings[i] = objectives[i].description;

				if ( strings[i].Length > maxLength ) {
					strings[i] = strings[i].Substring ( 0, maxLength ) + "...";
				}
			}

			return strings;
		}
	}

	public Quest[] userQuests = new Quest[0];
	public Quest[] potentialQuests = new Quest[0];
	public int activeQuest = -1;
	
	public string[] GetQuestNames () {
		string[] strings = new string [ potentialQuests.Length ];
		
		for ( int i = 0; i < strings.Length; i++ ) {
			strings[i] = potentialQuests[i].title;
		}

		return strings;
	}
	
	public string[] GetObjectiveNames ( string quest ) {
		List< string > strings = new List< string > ();
		
		for ( int i = 0; i < potentialQuests.Length; i++ ) {
			if ( quest == potentialQuests[i].title ) {
				for ( int o = 0; o < potentialQuests[i].objectives.Length; o++ ) {
					strings.Add ( potentialQuests[i].objectives[o].description );
				}
				break;
			}
		}

		return strings.ToArray ();
	}

	public int GetIndex ( string title ) {
		for ( int i = 0; i < potentialQuests.Length; i++ ) {
			if ( potentialQuests[i].title == title ) {
				return i;
			}
		}
		
		return 0;
	}
	
	public void SetActiveQuest ( Quest quest ) {
		for ( int i = 0; i < userQuests.Length; i++ ) {
			if ( userQuests[i] == quest ) {
				activeQuest = i;
				return;
			}
		}

		activeQuest = -1;
	}

	public Quest GetActiveQuest () {
		if ( activeQuest >= 0 && activeQuest < userQuests.Length ) {
			return userQuests[activeQuest];
		}

		return null;
	}

	public void AddUserQuest ( Quest quest ) {
		List< Quest > tmp = new List< Quest > ( userQuests );

		activeQuest = tmp.Count;

		tmp.Add ( quest );

		userQuests = tmp.ToArray ();
	}

	public void RemoveUserQuest ( Quest quest ) {
		List< Quest > tmp = new List< Quest > ( userQuests );

		tmp.Remove ( quest );

		userQuests = tmp.ToArray ();
	}
	
	public void AddPotentialQuest ( Quest quest ) {
		List< Quest > tmp = new List< Quest > ( potentialQuests );

		tmp.Add ( quest );

		potentialQuests = tmp.ToArray ();
	}

	public void RemovePotentialQuest ( Quest quest ) {
		List< Quest > tmp = new List< Quest > ( potentialQuests );

		tmp.Remove ( quest );

		potentialQuests = tmp.ToArray ();
	}

	public Quest GetUserQuest ( string title ) {
		for ( int i = 0; i < userQuests.Length; i++ ) {
			if ( userQuests[i].title == title ) {
				return userQuests[i];
			}
		}

		return null;
	}
	
	public Quest GetPotentialQuest ( string title ) {
		for ( int i = 0; i < potentialQuests.Length; i++ ) {
			if ( potentialQuests[i].title == title ) {
				return potentialQuests[i];
			}
		}

		return null;
	}

	public bool IsQuestCompleted ( string title ) {
		Quest quest = GetUserQuest ( title );

		if ( quest != null ) {
			return quest.completed;

		} else {
			return false;
				
		}
	}
}
