<?php
/*
If you would rather use the tpl than the text box in the UI, you can reconstruct a facsimile here.  See extlink-extra-leaving.tpl.example.php for an example and description of available variables.

Don't remove any CSS classes if you want them to function correctly, but add any that you need.
*/
?>
<div class="extlink-extra-leaving">
  <div class="modal fade" id="extlink-extra-leaving-bootstrap-modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        </div>
        <div class="modal-body">
          <?php
            print $alert_text;
          ?>
        </div>
        <div class="modal-footer">
          <button id="modal-go-button" class="btn btn-primary">Continue</button>
        </div>
      </div>
    </div>
  </div>
</div>
