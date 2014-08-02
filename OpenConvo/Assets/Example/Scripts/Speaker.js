#pragma strict

public class Speaker extends MonoBehaviour {
	public var speakers : OCSpeaker[] = new OCSpeaker[0];
	public var facing : GameObject;

	private var tree : OCTree;

	public function Start () {
		// Get OCTree component
		tree = this.GetComponent.< OCTree > ();

		// Match speakers array to OCTree component
		if ( tree.speakers.Length != speakers.Length ) {
			speakers = new OCSpeaker [ tree.speakers.Length ];

			for ( var i : int = 0; i < speakers.Length; i++ ) {
				speakers[i] = new OCSpeaker ( tree.speakers[i], GameObject.Find ( tree.speakers[i] ) );
			}
		}
	}

	public function Update () {
		var faceGoal : Vector3;
		
		if ( facing ) {
			faceGoal = facing.transform.position;
		}


		var faceRot : Vector3 = faceGoal - this.transform.position;
		faceRot.y = 0;

		this.transform.rotation = Quaternion.Slerp ( this.transform.rotation, Quaternion.LookRotation ( faceRot ), Time.deltaTime * 5 );
	}
}
