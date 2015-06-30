<?php
/* 
If you would rather use the tpl than the text box in the UI, you can reconstruct a facsimile here.  See extlink-extra-leaving.tpl.example.php for an example and description of available variables.  

Don't remove any CSS classes if you want them to function correctly, but add any that you need.
*/
?>
<div class="extlink-extra-leaving">
	<div class="modal" id="myModal">
    <div class="modal-dialog">
      <div class="modal-content">
      	<div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
          <h4 class="modal-title">You\'re leaving the site</h4>
       </div><div class="container"></div>
       <div class="modal-body">
       		<?php 
				  		print $alert_text; 
				  ?>
        </div>
        <div class="modal-footer">
          <button data-dismiss="modal" id="modal-close-button" class="btn">Close</button>
          <button id="modal-go-button" class="btn btn-primary">Go</button>
        </div>
      </div>
    </div>
  </div>
</div>
