skygear.config({
  endPoint: 'http://localhost:3001/',
  apiKey: 'changeme'
});

function goToIndex() {
  window.location.href = "/";
}

function goToWriteBlogs() {
  window.location.href = "/write.html";
}

function setSignupErrorMsg(msg) {
  $('#signup-error').text(msg);
}

function signup(email, password, data) {
  skygear.auth.signup({
    email: email
  }, password, data)
  .then(function(user) {
    goToWriteBlogs();
  }, function(err) {
    stopLoading();
    setSignupErrorMsg(err);
  });
}

function login(email, password) {
  skygear.auth.login({
    email: email
  }, password)
  .then(function(user) {
    goToWriteBlogs();
  }, function(err) {
    stopLoading();
    setSignupErrorMsg(err);
  });
}

$('#signup-btn').click(function() {
  var email = $('#signupInputEmail').val();
  var password = $('#signupInputPassword').val();
  var role = $('#signupInputRole').val();
  var data = { role: role };
  var wantLogin = $('#loginCheck').is(':checked');
  startLoading();
  if (!wantLogin) {
    signup(email, password, data);
  } else {
    login(email, password);
  }
  setSignupErrorMsg('');
  return false;
});

$('#logout-btn').click(function() {
  skygear.auth.logout().then(function() {
    goToIndex();
  });
});

$('#write-blog-btn').click(function() {
  var title = $('#blogTitleInput').val()
  var content = $('#blogContentTextArea').val();
  var data = {
    userID: skygear.auth.currentUser.userID,
    title,
    content,
  };

  startLoading();
  skygear.lambda('write_blog', data).then(function() {
    stopLoading();
    $('#write-blog-form').trigger('reset');
  });

  return false;
});

function fetchBlogs() {
  skygear.lambda('fetch_blogs', { }).then(function(results) {
    let output = '';
    if (results) {
      results.forEach(r => {
        output += `<div><p>title: ${r.title}</p><p>content: ${r.content}</p><hr/></div>`;
      })
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