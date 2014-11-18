using UnityEngine;
using UnityEditor;
using System.Collections;
using System.Collections.Generic;

[CustomEditor (typeof(OCTree))]
public class OCTreeInspector : Editor {
	override public void OnInspectorGUI () {
		OCTree tree = (OCTree) target;

		List< string > roots = new List< string > ();

		for ( int i = 0; i < tree.rootNodes.Length; i++ ) {
			roots.Add ( i.ToString() );
		}

		tree.currentRoot = EditorGUILayout.Popup ( "Current root", tree.currentRoot, roots.ToArray() );

		if ( GUILayout.Button ( "Open editor", GUILayout.Height ( 32 ) ) ) {
			OCTreeEditor.target = tree;
			EditorWindow.GetWindow ( typeof(OCTreeEditor) );
		}
	}
}
