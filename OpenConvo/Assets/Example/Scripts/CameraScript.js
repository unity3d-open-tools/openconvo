#pragma strict

public class CameraScript extends MonoBehaviour {
	public function Update () {
		if ( !OCManager.GetInstance().inConversation && Input.GetMouseButtonDown ( 0 ) ) {
			var ray : Ray = camera.ScreenPointToRay ( Input.mousePosition );
			var hit : RaycastHit;

			if ( Physics.Raycast ( ray, hit, 200 ) ) {
				var tree : OCTree = hit.collider.gameObject.GetComponent.< OCTree > ();
				
				if ( tree ) {
					OCManager.GetInstance().StartConversation ( tree );
				
				} else if ( hit.collider.gameObject.name == "Ball" ) {
					OCManager.GetInstance().quests.GetActiveQuest().ProgressObjective ( 0, 1 );
					hit.collider.gameObject.SetActive ( false );

				}
			}
		}
	}
}
