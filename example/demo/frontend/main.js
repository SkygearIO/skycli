skygear.defaultContainer.configure({
  endpoint: 'CHANGE_TO_YOUR_APPS_ENDPOINT',
  apiKey: 'CHANGE_TO_YOUR_APPS_API_KEY'
});

function goToIndex() {
  window.location.href = '/';
}

function goToWriteBlogs() {
  window.location.href = '/write.html';
}

function setSignupErrorMsg(msg) {
  $('#signup-error').text(msg);
}

function signup(email, password) {
  skygear.defaultContainer.auth.signup({ email: email }, password).then(
    function(user) {
      goToWriteBlogs();
    },
    function(err) {
      stopLoading();
      setSignupErrorMsg(err);
    }
  );
}

function login(email, password) {
  skygear.defaultContainer.auth.login(email, password).then(
    function(user) {
      goToWriteBlogs();
    },
    function(err) {
      stopLoading();
      setSignupErrorMsg(err);
    }
  );
}

$('#signup-btn').click(function() {
  var email = $('#signupInputEmail').val();
  var password = $('#signupInputPassword').val();
  var wantLogin = $('#loginCheck').is(':checked');
  startLoading();
  if (!wantLogin) {
    signup(email, password);
  } else {
    login(email, password);
  }
  setSignupErrorMsg('');
  return false;
});

$('#logout-btn').click(function() {
  skygear.defaultContainer.auth.logout().then(function() {
    goToIndex();
  });
});

$('#write-blog-btn').click(function() {
  var title = $('#blogTitleInput').val();
  var content = $('#blogContentTextArea').val();
  var data = {
    userID: skygear.defaultContainer.auth.currentUser.id,
    title,
    content
  };

  startLoading();

  skygear.defaultContainer
    .fetch('/api/write_blog', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(function() {
      stopLoading();
      $('#write-blog-form').trigger('reset');
    });

  return false;
});

function fetchBlogs() {
  skygear.defaultContainer
    .fetch('api/fetch_blogs', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((resp) => resp.json())
    .then(function({ result }) {
      let output = '';
      if (result) {
        result.forEach((r) => {
          output += `<div><p>title: ${r.title}</p><p>content: ${r.content}</p><hr/></div>`;
        });
      }
      stopLoading();
      $('#demos-section').append(output);
    });
}

function startLoading() {
  $('#loading').removeClass('d-none');
}

function stopLoading() {
  $('#loading').addClass('d-none');
}
