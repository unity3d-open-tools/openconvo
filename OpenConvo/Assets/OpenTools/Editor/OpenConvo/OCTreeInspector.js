#pragma strict

import System.Collections.Generic;

@CustomEditor ( OCTree )
public class OCTreeInspector extends Editor {
	private var editRoot : int = 0;
	
	public static function SavePrefab ( target : UnityEngine.Object ) {
		var selectedGameObject : GameObject;
		var selectedPrefabType : PrefabType;
		var parentGameObject : GameObject;
		var prefabParent : UnityEngine.Object;
		     
		selectedGameObject = Selection.gameObjects[0];
		selectedPrefabType = PrefabUtility.GetPrefabType(selectedGameObject);
		parentGameObject = selectedGameObject.transform.root.gameObject;
		prefabParent = PrefabUtility.GetPrefabParent(selectedGameObject);
		     
		EditorUtility.SetDirty(target);
		     
		if (selectedPrefabType == PrefabType.PrefabInstance) {
			PrefabUtility.ReplacePrefab(parentGameObject, prefabParent,
			ReplacePrefabOptions.ConnectToPrefab);
	    	}
	}
	
	override function OnInspectorGUI () {
		var tree : OCTree = target as OCTree;

		var rootNodes : String[] = new String[tree.rootNodes.Length];
		for ( var i : int = 0; i < rootNodes.Length; i++ ) {
			rootNodes[i] = i.ToString();
		}

		tree.eventHandler = EditorGUILayout.ObjectField ( "Event handler", tree.eventHandler, typeof ( GameObject ), true ) as GameObject;
		tree.currentRoot = EditorGUILayout.Popup ( "Current root node", tree.currentRoot, rootNodes );	
	
		EditorGUILayout.Space ();

		EditorGUILayout.LabelField ( "Speakers", EditorStyles.boldLabel );

		for ( i = 0; i < tree.speakers.Length; i++ ) {
			EditorGUILayout.BeginHorizontal ();
			tree.speakers[i] = EditorGUILayout.ObjectField ( i.ToString(), tree.speakers[i], typeof ( GameObject ), true ) as GameObject;
			
			GUI.backgroundColor = Color.red;
			if ( GUILayout.Button ( "x", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
				var tmpSpk : List.< GameObject > = new List.< GameObject > ( tree.speakers );

				tmpSpk.RemoveAt ( i );

				tree.speakers = tmpSpk.ToArray ();
			}
			GUI.backgroundColor = Color.white;
			
			EditorGUILayout.EndHorizontal ();
		}
		
		GUI.backgroundColor = Color.green;
		if ( GUILayout.Button ( "+", GUILayout.Width ( 28 ), GUILayout.Height ( 14 ) ) ) {
			tmpSpk = new List.< GameObject > ( tree.speakers );

			tmpSpk.Add ( null );

			tree.speakers = tmpSpk.ToArray ();
		}
			GUI.backgroundColor = Color.white;

		EditorGUILayout.Space ();

		if ( GUILayout.Button ( "Editor" ) ) {
			OCTreeWindow.ShowEditor ( tree );
		}
	}
}
