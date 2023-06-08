$(document).ready(function () {
  configurePlatformIdButtons();
});
//Change platformid buttons - Triton Digital QA usage only.
var platformid = getUrlVars()["platformid"] || "prod";
function configurePlatformIdButtons() {
  $("#platform_" + platformid + "_button").button("toggle");
  $("#platform_dev_button").click(function () {
    window.location.href = "userreg.php?platformid=dev";
  });
  $("#platform_preprod_button").click(function () {
    window.location.href = "userreg.php?platformid=preprod";
  });
  $("#platform_prod_button").click(function () {
    window.location.href = "userreg.php?platformid=prod";
  });
}
//End platformid configuration - Triton Digital QA usage only.

var player; /* TD player instance */

/**
 * The function tdPlayerApiReady is automatically called by the API once the Player API is ready to be used.
 * The function is called on the window scope.
 */
window.tdPlayerApiReady = function () {
  console.log("--- TD Player API Loaded ---");
  initPlayer();
};

function initPlayer() {
  /* TD player configuration object used to create player instance */
  var tdPlayerConfig = {
    coreModules: [
      {
        id: "MediaPlayer",
        playerId: "td_container",
        platformId: platformid + "01", //prod01 by default.
        isDebug: true,
        techPriority: ["Html5", "Flash"], // ['Html5', 'Flash'] (default behaviour) or ['Flash', 'Html5'] or ['Flash'] or ['Html5']
      },
      {
        id: "UserRegistration",
        //seeApiUrl:'http://www.testsee.com/widget/{tenantId}/see.js',
        platformId: platformid + "01",
        tenantId: "see_1670",
      },
    ],
  };

  player = new TdPlayerApi(tdPlayerConfig);
  player.addEventListener("player-ready", onPlayerReady);
  player.addEventListener("configuration-error", onConfigurationError);
  player.addEventListener("module-error", onModuleError);
  player.loadModules();
}

function onPlayerReady() {
  // Call UserRegistration init()
  player.UserRegistration.init();

  // Event registration
  player.addEventListener("user-logged-in", onUserLoggedIn);
  player.addEventListener("user-login-error", onUserLoginError);
  player.addEventListener("user-logged-out", onUserLoggedOut);
  player.addEventListener("user-logout-error", onUserLogoutError);
  player.addEventListener("user-details", onUserDetails);
  player.addEventListener("user-details-error", onUserDetailsError);
  player.addEventListener("social-connect", onSocialConnect);
  player.addEventListener("social-connect-error", onSocialConnectError);
  player.addEventListener("social-remove", onSocialRemove);
  player.addEventListener("social-remove-error", onSocialRemoveError);
  player.addEventListener("register-fields", onRegisterFields);
  player.addEventListener("register-fields-error", onRegisterFieldsError);
  player.addEventListener("register-user", onRegisterUser);
  player.addEventListener("register-user-error", onRegisterUserError);
  player.addEventListener("user-update", onUserUpdate);
  player.addEventListener("user-update-error", onUserUpdateError);
  player.addEventListener("forgot-password", onForgotPassword);
  player.addEventListener("forgot-password-error", onForgotPasswordError);
  player.addEventListener("see-metaapi-not-ready", onMetaApiNotReady);
  player.addEventListener("meta-set", onMetaSet);
  player.addEventListener("meta-set-error", onMetaSetError);
  player.addEventListener("meta-get", onMetaGet);
  player.addEventListener("meta-get-error", onMetaGetError);
  player.addEventListener("meta-update", onMetaUpdate);
  player.addEventListener("meta-update-error", onMetaUpdateError);
  player.addEventListener("meta-delete", onMetaDelete);
  player.addEventListener("meta-delete-error", onMetaDeleteError);
  player.addEventListener("meta-clear", onMetaClear);
  player.addEventListener("meta-clear-error", onMetaClearError);
  player.addEventListener("meta-list", onMetaList);
  player.addEventListener("meta-list-error", onMetaListError);

  initControlsUi();
}

function onConfigurationError(e) {
  debug("Configuration error", true);
  console.log(e);
}

function onModuleError(object) {
  var message = "";

  $.each(object.data.errors, function (i, val) {
    message += "ERROR : " + val.data.error.message + "<br/>";
  });

  $("#status").html(
    '<p><span class="label label-important">' + message + "</span><p></p>"
  );
}

function initControlsUi() {
  $("#clearDebug").click(function () {
    clearDebugInfo();
  });

  // SEE login button click event
  $("#seeLogin").click(function () {
    seeLogin();
  });

  // SEE Facebook login button click event
  $("#seeFacebookLogin").click(function () {
    seeFacebookLogin();
  });

  // SEE Google login button click event
  $("#seeGoogleLogin").click(function () {
    seeGoogleLogin();
  });

  // SEE Facebook connect button click event
  $("#seeFacebookConnect").click(function () {
    seeFacebookConnect();
  });

  // SEE Google connect button click event
  $("#seeGoogleConnect").click(function () {
    seeGoogleConnect();
  });

  // SEE Facebook disconnect button click event
  $("#seeFacebookRemove").click(function () {
    seeFacebookRemove();
  });

  // SEE Google disconnect button click event
  $("#seeGoogleRemove").click(function () {
    seeGoogleRemove();
  });

  // SEE logout button click event
  $("#seeLogout").click(function () {
    // clear #seeForm (we may write an error there)
    $("#seeForm").html("");
    // logout
    player.UserRegistration.logout();
  });

  // SEE Forgot password button click event
  $("#seeForgotPassword").click(function () {
    seeForgotPassword();
  });

  // Gets the SEE logged in user details (final details TBD)
  $("#seeUserDetails").click(function () {
    seeUserDetails();
  });

  // Display reg/update form depending on whether you are logged in
  $("#seeRegForm").click(function () {
    seeRegForm();
  });

  // delegate the click event for the SEE registration form button
  $("#seeForm").delegate("#seeRegister", "click", function () {
    seeRegister();
  });

  // delegate the click event for the SEE update form button
  $("#seeForm").delegate("#seeUpdate", "click", function () {
    seeUpdate();
  });

  // SEE Meta Set button click event
  $("#seeMetaSet").click(function () {
    seeMetaSet();
  });

  // SEE Meta Get button click event
  $("#seeMetaGet").click(function () {
    seeMetaGet();
  });

  // SEE Meta Update button click event
  $("#seeMetaUpdate").click(function () {
    seeMetaUpdate();
  });

  // SEE Meta Delete button click event
  $("#seeMetaDelete").click(function () {
    seeMetaDelete();
  });

  // SEE Meta Clear button click event
  $("#seeMetaClear").click(function () {
    seeMetaClear();
  });

  // SEE Meta List button click event
  $("#seeMetaList").click(function () {
    seeMetaList();
  });
}

/**
 * SEE Login button click event function
 *
 * Takes the username and password and runs them through
 * player.UserRegistration.login
 */
function seeLogin() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  var username = $("#seeLoginUsername").val();
  var password = $("#seeLoginPassword").val();

  player.UserRegistration.login({
    method: "Userpwd",
    username: username,
    password: password,
    persist: 0,
  });
}

/**
 * SEE facebook login click event function
 *
 * Calls the UserRegistration login method with the Facebook method
 *
 * @returns null
 */
function seeFacebookLogin() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  player.UserRegistration.login({ method: "Facebook" });
}

/**
 * SEE google login click event function
 *
 * Calls the UserRegistration login method with the Google method
 *
 * @returns null
 */
function seeGoogleLogin() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  player.UserRegistration.login({ method: "Google" });
}

/**
 * SEE facebook connect click event function
 *
 * Calls the UserRegistration connectSocial method for the Facebook network
 *
 * @returns null
 */
function seeFacebookConnect() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  player.UserRegistration.connectSocial("Facebook");
}

/**
 * SEE google connect click event function
 *
 * Calls the UserRegistration connectSocial method for the Google network
 *
 * @returns null
 */
function seeGoogleConnect() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  player.UserRegistration.connectSocial("Google");
}

/**
 * SEE facebook disconnect click event function
 *
 * Calls the UserRegistration removeSocial method for the Facebook network
 *
 * @returns null
 */
function seeFacebookRemove() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  player.UserRegistration.removeSocial("Facebook");
}

/**
 * SEE google disconnect click event function
 *
 * Calls the UserRegistration removeSocial method for the Google network
 *
 * @returns null
 */
function seeGoogleRemove() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");

  player.UserRegistration.removeSocial("Google");
}

/**
 * Successful user login event function
 *
 * @param result object login api result object
 *
 * @return null
 */
function onUserLoggedIn(result) {
  debug("user-logged-in: " + JSON.stringify(result));

  $(".social-connect-buttons").toggle();
  $(".social-remove-buttons").toggle();
}

/**
 * Failed user login event function
 *
 * @param result object failed login api result object
 *
 * @return null
 */
function onUserLoginError(result) {
  debug("user-login-error: " + JSON.stringify(result));
}

/**
 * Successful social connect event function
 *
 * @param result object login api result object
 *
 * @return null
 */
function onSocialConnect(result) {
  debug("social-connect: " + JSON.stringify(result));
}

/**
 * Failed social connect event function
 *
 * @param result object login api result object
 *
 * @return null
 */
function onSocialConnectError(result) {
  debug("social-connect-error: " + JSON.stringify(result));
}

/**
 * Successful social remove event function
 *
 * @param result object login api result object
 *
 * @return null
 */
function onSocialRemove(result) {
  debug("social-remove: " + JSON.stringify(result));
}

/**
 * Failed social remove event function
 *
 * @param result object login api result object
 *
 * @return null
 */
function onSocialRemoveError(result) {
  debug("social-remove-error: " + JSON.stringify(result));
}

/**
 * Successful user logout event function
 *
 * @param result object logout api result object
 *
 * @return null
 */
function onUserLoggedOut(result) {
  debug("user-logged-out: " + JSON.stringify(result));

  $(".social-connect-buttons").toggle();
}

/**
 * Failed user logout event function
 *
 * @param result object failed logout api result object
 *
 * @return null
 */
function onUserLogoutError(result) {
  debug("user-logout-error: " + JSON.stringify(result));
}

/**
 * SEE Forgot password button click event function
 *
 * Calls the forgotPassword method on the API with the given username
 *
 * @returns null
 */
function seeForgotPassword() {
  var username = $("#seeLoginUsername").val();
  player.UserRegistration.forgotPassword(username);
}

/**
 * Successful forgotPassword event function
 *
 * @param result object forgotPassword result object
 *
 * @returns null
 */
function onForgotPassword(result) {
  debug("forgot-password: " + JSON.stringify(result));
}

/**
 * Failed forgotPassword event function
 *
 * @param result object failed forgotPassword result object
 *
 * @returns null
 */
function onForgotPasswordError(result) {
  debug("forgot-password-error: " + JSON.stringify(result));
}

/**
 * SEE User Details button click event function
 *
 * Calls player.UserRegistration.getUserDetails
 */
function seeUserDetails() {
  player.UserRegistration.getUserDetails();
}

/**
 * Successful getUserDetails event function
 *
 * @param result object getUserDetails api result object
 *
 * @return null
 */
function onUserDetails(result) {
  debug("user-details: " + JSON.stringify(result));
}

/**
 * Failed getUserDetails event function
 *
 * @param result object Failed getUserDetails api result object'
 *
 * @return null
 */
function onUserDetailsError(result) {
  debug("user-details-error: " + JSON.stringify(result));
}

/**
 * SEE Reg/Update button click event function
 *
 * Calls player.UserRegistration.registerFields with a callback
 * that populates a (very crude) form.
 */
function seeRegForm() {
  // clear #seeForm (we may write an error there)
  $("#seeForm").html("");
  player.UserRegistration.registerFields();
}

/**
 * Successful registerFields event function
 *
 * Populates a form with the registration field data. If the user
 * is not logged in the form will be blank. If the user is logged
 * in the form is populated with their answers.
 *
 * Not implemented here but also included with the field data is
 * a regex for client-side validation of user input. This regex
 * is stored in field.valid
 *
 * @param result object registerFields api result object
 *
 * @return null
 */
function onRegisterFields(result) {
  debug("register-fields: " + JSON.stringify(result));

  // Build the registration/update form
  // Loop through the registration fields
  for (var i = 0; i < result.data.fields.length; i++) {
    var field = result.data.fields[i];
    // Field label
    $("#seeForm").append(field.description + ": ");
    // Fields come in different types which are handled here
    switch (field.type) {
      case "single_line":
        // input box
        $("#seeForm").append(
          '<input type="text" id="seeForm_' +
            field.name +
            '" name="' +
            field.name +
            '" value="' +
            field.value +
            '"><br/>'
        );
        break;
      case "password":
        // Password
        $("#seeForm").append(
          '<input type="password" id="seeForm_' +
            field.name +
            '" name="' +
            field.name +
            '"><br/>'
        );
        break;
      case "multi_line":
        // textarea
        $("#seeForm").append(
          '<textarea id="seeForm_' +
            field.name +
            '" name="' +
            field.name +
            '">' +
            field.value +
            "</textarea><br/>"
        );
        break;
      case "single_choice":
        // dropdown
        var options = "";
        for (var j = 0; j < field.answers.length; j++) {
          var selected = "";
          if (field.answers[j] == field.value) {
            selected = " selected";
          }
          options +=
            "<option" + selected + ">" + field.answers[j] + "</option>";
        }
        $("#seeForm").append(
          '<select id="seeForm_' +
            field.name +
            '" name="' +
            field.name +
            '">' +
            options +
            "</select><br/>"
        );
        break;
      case "multi_choice":
        // listbox
        var options = "";
        for (var j = 0; j < field.answers.length; j++) {
          var selected = "";
          if (field.value.indexOf(field.answers[j]) > 0) {
            selected = " selected";
          }
          options +=
            "<option" + selected + ">" + field.answers[j] + "</option>";
        }
        $("#seeForm").append(
          '<select id="seeForm_' +
            field.name +
            '" name="' +
            field.name +
            '" multiple size="5">' +
            options +
            "</select><br/>"
        );
        break;
      default:
        break;
    }
  }

  // Determine the form type (Register/Update) based on the user's
  // logged in state
  var formType = "Register";
  if (player.UserRegistration.isLoggedIn()) {
    formType = "Update";
  }

  // Form button
  $("#seeForm").append(
    '<input type="button" class="btn" id="see' +
      formType +
      '" value="' +
      formType +
      '"/>'
  );
}

/**
 * Failed registerFields event function
 *
 * @param result object failed registerFields api result object
 *
 * @return null
 */
function onRegisterFieldsError(result) {
  debug("register-fields-error: " + JSON.stringify(result));
}

/**
 * Helper method to put form data into an object of key/value pairs
 *
 * Takes a form DOM element as a parameter and takes all the form fields
 * and stores the answers in an object with properties for each field.
 *
 * @param  form   DOM element for the form
 * @return object Object of form data in key/value pairs
 */
function _formDataToObject(form) {
  var paramObj = {};
  $.each($(form).serializeArray(), function (_, kv) {
    if (paramObj.hasOwnProperty(kv.name)) {
      paramObj[kv.name] = $.makeArray(paramObj[kv.name]);
      paramObj[kv.name].push(kv.value);
    } else {
      paramObj[kv.name] = kv.value;
    }
  });
  return paramObj;
}

/**
 * SEE register button click event function
 *
 * Gets the data from the form and passes it to
 * player.UserRegistration.registerUser.
 */
function seeRegister() {
  var fields = _formDataToObject($("#seeForm"));

  // clear field errors
  $(".seeError").remove();

  player.UserRegistration.registerUser(fields, 0);
}

/**
 * Failled to start Meta API before use
 *
 * @returns null
 */
function onMetaApiNotReady() {
  debug("see-metaapi-not-ready");
}

/**
 * SEE Meta Set button click event function
 *
 * Gets the data from the meta form fields and passes to
 * player.UserRegistration.metaSet
 *
 * @return null
 */
function seeMetaSet() {
  var doc = $("#meta-doc").val(),
    type = $("#meta-type").val(),
    errMsg = "You must have valid JSON in the Doc field.";
  if (!type) {
    alert("You must enter a document 'type'.");
    $("#meta-type").focus();
    return;
  }
  try {
    doc = $.parseJSON(doc);
  } catch (e) {
    if (doc.match(/\w+'*\s*\:/)) {
      errMsg += " Remember to surround JSON keys with double quotes.";
    }
    alert(errMsg);
    return;
  }
  player.UserRegistration.metaSet(doc, type);
}

/**
 * Successful Meta Set event function
 *
 * @param result object Meta Set result object
 *
 * @returns null
 */
function onMetaSet(result) {
  debug("meta-set: " + JSON.stringify(result));
}

/**
 * Failed Meta Set event function
 *
 * @param result object failed Meta Set result object
 *
 * @returns null
 */
function onMetaSetError(result) {
  debug("meta-set-error: " + JSON.stringify(result));
}

/**
 * SEE Meta Get button click event function
 *
 * Gets the data from the meta form fields and passes to
 * player.UserRegistration.metaGet
 *
 * @return null
 */
function seeMetaGet() {
  var id = $("#meta-id").val();
  if (!id) {
    alert("You must enter an ID 'type'.");
    $("#meta-id").focus();
    return;
  }
  player.UserRegistration.metaGet(id);
}

/**
 * Successful Meta Get event function
 *
 * @param result object Meta Get result object
 *
 * @returns null
 */
function onMetaGet(result) {
  debug("meta-get: " + JSON.stringify(result));
}

/**
 * Failed Meta Get event function
 *
 * @param result object failed Meta Get result object
 *
 * @returns null
 */
function onMetaGetError(result) {
  debug("meta-get-error: " + JSON.stringify(result));
}

/**
 * SEE Meta Update button click event function
 *
 * Gets the data from the meta form fields and passes to
 * player.UserRegistration.metaUpdate
 *
 * @return null
 */
function seeMetaUpdate() {
  var doc = $("#meta-doc").val(),
    id = $("#meta-id").val(),
    errMsg = "You must have valid JSON in the Doc field.";
  if (!id) {
    alert("You must enter an ID 'type'.");
    $("#meta-id").focus();
    return;
  }
  try {
    doc = $.parseJSON(doc);
  } catch (e) {
    if (doc.match(/\w+'*\s*\:/)) {
      errMsg += " Remember to surround JSON keys with double quotes.";
    }
    alert(errMsg);
    return;
  }
  player.UserRegistration.metaUpdate(id, doc);
}

/**
 * Successful Meta Update event function
 *
 * @param result object Meta Update result object
 *
 * @returns null
 */
function onMetaUpdate(result) {
  debug("meta-update: " + JSON.stringify(result));
}

/**
 * Failed Meta Update event function
 *
 * @param result object failed Meta Update result object
 *
 * @returns null
 */
function onMetaUpdateError(result) {
  debug("meta-update-error: " + JSON.stringify(result));
}

/**
 * SEE Meta Delete button click event function
 *
 * Gets the data from the meta form fields and passes to
 * player.UserRegistration.metaDelete
 *
 * @return null
 */
function seeMetaDelete() {
  var id = $("#meta-id").val();
  if (!id) {
    alert("You must enter an ID 'type'.");
    $("#meta-id").focus();
    return;
  }
  player.UserRegistration.metaDelete(id);
}

/**
 * Successful Meta Delete event function
 *
 * @param result object Meta Delete result object
 *
 * @returns null
 */
function onMetaDelete(result) {
  debug("meta-delete: " + JSON.stringify(result));
}

/**
 * Failed Meta Delete event function
 *
 * @param result object failed Meta Delete result object
 *
 * @returns null
 */
function onMetaDeleteError(result) {
  debug("meta-delete-error: " + JSON.stringify(result));
}

/**
 * SEE Meta Clear button click event function
 *
 * Gets the data from the meta form fields and passes to
 * player.UserRegistration.metaClear
 *
 * @return null
 */
function seeMetaClear() {
  var type = $("#meta-type").val();
  if (!type) {
    alert("You must enter a 'type'.");
    $("#meta-type").focus();
    return;
  }
  player.UserRegistration.metaClear(type);
}

/**
 * Successful Meta Clear event function
 *
 * @param result object Meta Clear result object
 *
 * @returns null
 */
function onMetaClear(result) {
  debug("meta-clear: " + JSON.stringify(result));
}

/**
 * Failed Meta Clear event function
 *
 * @param result object failed Meta Clear result object
 *
 * @returns null
 */
function onMetaClearError(result) {
  debug("meta-clear-error: " + JSON.stringify(result));
}

/**
 * SEE Meta List button click event function
 *
 * Gets the data from the meta form fields and passes to
 * player.UserRegistration.metaList
 *
 * @return null
 */
function seeMetaList() {
  var type = $("#meta-type").val();
  if (!type) {
    alert("You must enter a document 'type'.");
    $("#meta-type").focus();
    return;
  }
  player.UserRegistration.metaList(type);
}

/**
 * Successful Meta List event function
 *
 * @param result object Meta List result object
 *
 * @returns null
 */
function onMetaList(result) {
  debug("meta-list: " + JSON.stringify(result));
}

/**
 * Failed Meta List event function
 *
 * @param result object failed Meta List result object
 *
 * @returns null
 */
function onMetaListError(result) {
  debug("meta-list-error: " + JSON.stringify(result));
}

/**
 * Sucessful registerUser event function
 *
 * @param result object registerUser api result object
 *
 * @return null
 */
function onRegisterUser(result) {
  debug("register-user: " + JSON.stringify(result));
  // Clear form
  $("#seeForm").html("");
}

/**
 * Failed registerUser event function
 *
 * Updates the form with field specific errors contained in the result object
 *
 * @param result object failed registerUser api result object
 *
 * @return null
 */
function onRegisterUserError(result) {
  debug("register-user-error: " + JSON.stringify(result));

  // The error result should contain a fields object which may contain
  // errors for specific fields
  if (typeof result.data.fields == "object") {
    $.each(result.data.fields, function (name, field) {
      if (typeof field.error == "string") {
        $("#seeForm_" + name).after(
          '<span class="seeError">' + field.error + "</span>"
        );
      }
    });
  }
}

/**
 * SEE update button click event function
 *
 * Gets the data from the form and passes it to
 * player.UserRegistration.updateUser
 */
function seeUpdate() {
  var fields = _formDataToObject($("#seeForm"));

  player.UserRegistration.updateUser(fields);
}

/**
 * Sucessful updateUser event function
 *
 * @param result object updateUser api result object
 *
 * @return null
 */
function onUserUpdate(result) {
  debug("update-user: " + JSON.stringify(result));

  // Clear form
  $("#seeForm").html("");
}

/**
 * Failed updateUser event function
 *
 * Updates the form with field specific errors contained in the result object
 *
 * @param result object failed updateUser api result object
 *
 * @return null
 */
function onUserUpdateError(result) {
  debug("update-user-error: " + JSON.stringify(result));

  // The error result should contain a fields object which may contain
  // errors for specific fields
  if (typeof result.data.fields == "object") {
    $.each(result.data.fields, function (name, field) {
      if (typeof field.error == "string") {
        $("#seeForm_" + name).after(
          '<span class="seeError">' + field.error + "</span>"
        );
      }
    });
  }
}

function getUrlVars() {
  var vars = [],
    hash;
  var hashes = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split("=");
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

function debug(info, error) {
  if (error) console.error(info);
  else console.log(info);

  $("#debugInformation").append(info);
  $("#debugInformation").append("\n");
}
function clearDebugInfo() {
  $("#debugInformation").html("");
}
