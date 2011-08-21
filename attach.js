(function($) {
  // taken from https://github.com/Flynsarmy/chrome-s3
  // and modified accordingly.
  var Uploader = {
    working: false,
    cur: null,
    current: null,
    queue: [],
    add: function(bucket, file, callback) {
      var key = escape( file.fileName );
      Uploader.queue.push({bucket: bucket, key: key, file: file, callback: callback});
      if (!Uploader.working) {
        Uploader.upload();
      }
    },
    upload: function() {
      Uploader.working = true;
      var cur = Uploader.queue.shift();
      Uploader.cur = cur;
      $.blockUI({
        message: "Uploading" + cur.file.fileName
      });

      var params = {
        content_type: cur.file.type
      };
      Uploader.current = S3Ajax.put(cur.bucket, cur.key, cur.file, params, Uploader.uploadComplete, Uploader.uploadError);
    },
    uploadCancel: function() {
      if ( !Uploader.working ) return false;

      if ( Uploader.current ) Uploader.current.abort();
      Uploader.queue = [];
      Uploader.uploadComplete();
      return false;
    },
    uploadComplete: function(req) {
      if (Uploader.cur && Uploader.cur.callback) {
        Uploader.cur.callback(Uploader.cur);
      }
      if (Uploader.queue.length > 0) {
        Uploader.upload();
      } else {
        Uploader.working = false;
        Uploader.current = null;
        Uploader.cur = null;
        $.unblockUI();
      }
    },
    uploadError: function(req) {
    }
  }

  function upload_files(File, callback) {
    for (i=0; i<File.files.length; i++) {
      Uploader.add(localStorage.bucket, File.files[i], callback);
    }

    return false;
  }

  var $classy = $('<button style="float: left; margin: 0;" class="classy gh-attach"><span>Attach...</span></button>');
  var $mini = $('<button class="minibutton bigger gh-attach"><span>Attach...</span></button>');
  var $form = $('<input style="position: absolute; left:-500px;" type="file" multiple="multiple" />');
  var $access_form = $(
    '<div id="gh-attach-form">' +
      '<h3>Setup Amazon Access</h3>' +
      '<p>' +
      '<label style="display: block;">' +
      'Access Key:' +
      '</label>' + 
      '<input type="text" name="access" />' +
      '</p>' +

      '<p>' +
      '<label style="display: block;">' +
      'Secret Key:' +
      '</label>' + 
      '<input type="text" name="secret" />' +
      '</p>' +

      '<p>' +
      '<label style="display: block;">' +
      'Bucket:' +
      '</label>' + 
      '<input type="text" name="bucket" />' +
      '</p>' +

      '<p>' +
      '<button class="minibutton bigger" style="margin-right: 5px;" id="gh-save">save</button>' +
      '<button class="minibutton bigger" id="gh-cancel">cancel</button>' +
      '</p>' +
    '</div>'
  );

  $access_form.find("#gh-save").click(function() {
    localStorage.access_key = $(this).closest("#gh-attach-form").find("input[name=access]").val();
    localStorage.secret_key = $(this).closest("#gh-attach-form").find("input[name=secret]").val();
    localStorage.bucket = $(this).closest("#gh-attach-form").find("input[name=bucket]").val();
    $.unblockUI();
    return false;
  });

  $access_form.find("#gh-cancel").click(function() {
    $.unblockUI();
    return false;
  });

  function get_button($button, textarea) {
    var form = $form.clone();
    form.change(function() {
      upload_files(this, function(hash) {
        var url = "http://" + hash.bucket + ".s3.amazonaws.com/" + hash.key;
        var text = "";
        if (hash.file.type.match(/image/)) {
          text += "![" + url + "]";
        } else {
          text += "[Attachment: " + url + "]";
        }
        text += "(" + url + ")\n";
        textarea.val(textarea.val() + text).focus();
      });
      return false;
    });
    $('body').append(form);

    var clone = $button.clone();
    clone.click(function() {
      if (!$.trim(localStorage.access_key) || !$.trim(localStorage.secret_key) ||
          !$.trim(localStorage.bucket)) {
        $.blockUI({
          message: $access_form,
          css: {
            cursor: null
          }
        });
        $('.blockOverlay').attr('title','Click to unblock').click($.unblockUI);
        return false;
      }

      S3Ajax.KEY_ID = localStorage.access_key;
      S3Ajax.SECRET_KEY = localStorage.secret_key;

      form.click();
      return false;
    });
    return clone;
  }
  
  $(function() {
    $("#js-new-issue-form .form-actions, #issue_comment_form .form-actions").each(function() {
      var textarea = $(this).parents("#js-new-issue-form, #issue_comment_form").find("textarea").last();
      var clone = get_button($classy, textarea);
      $(this).prepend(clone);
    });
    
    $(".comment.adminable .edit-button").click(function() {
      var textarea = $(this).parents(".comment.adminable").find("textarea").last();
      var clone = get_button($mini, textarea);
      $(this).closest(".comment.adminable")
      .find(".gh-attach").remove().end()
      .find(".form-actions").prepend(clone);
    });
  });
})(jQuery);
