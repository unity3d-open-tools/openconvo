using UnityEngine;
using System.Collections;
using System.Collections.Generic;

[System.Serializable]
public class OCFlag {
	public string id;
	public bool b;

	public OCFlag ( string id, bool b ) {
		this.id = id;
		this.b = b;
	}
}

[System.Serializable]
public class OCFlags {
	public List< OCFlag > flags = new List< OCFlag > ();

	public void Clear () {
		flags.Clear ();
	}

	public void Set ( string id, bool b ) {
		for ( int i = 0; i < flags.Count; i++ ) {
			if ( flags[i].id == id ) {
				flags[i].b = b;
				return;
			}
		}

		flags.Add ( new OCFlag ( id, b ) );
	}

	public bool Get ( string id ) {
		for ( int i = 0; i < flags.Count; i++ ) {
			if ( flags[i].id == id ) {
				return flags[i].b;
			}
		}

		return false;
	}
}
