#pragma strict

public class CameraScript extends MonoBehaviour {
	public var manager : OCManager;
	public var target : Transform;
	public var initRot : Quaternion;
		
	public function Start () {
		initRot = this.transform.rotation;
	}

	public function Update () {
		if ( target ) {
			transform.rotation = Quaternion.Slerp ( transform.rotation, Quaternion.LookRotation ( target.position - transform.position ), Time.deltaTime * 5 );
		} else {
			transform.rotation = Quaternion.Slerp ( transform.rotation, initRot, Time.deltaTime * 5 );
		}

		if ( manager.tree == null && Input.GetMouseButtonDown ( 0 ) ) {
			var ray : Ray = camera.ScreenPointToRay ( Input.mousePosition );
			var hit : RaycastHit;

			if ( Physics.Raycast ( ray, hit, Mathf.Infinity ) ) {
				var go : GameObject = hit.transform.gameObject;
				var tree : OCTree = go.GetComponent.<OCTree>();

				if ( tree ) {
					manager.StartConversation ( tree );
				}
			}
			
		}
	}
}
