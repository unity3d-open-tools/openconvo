﻿#pragma strict

import System.Collections.Generic;

@CustomEditor ( OCTree )
public class OCTreeInspector extends Editor {
	override function OnInspectorGUI () {
		var tree : OCTree = target as OCTree;

		if ( GUILayout.Button ( "Open editor" ) ) {
			OCTreeEditor.target = tree;
			EditorWindow.GetWindow ( OCTreeEditor );
		}
	}
}
