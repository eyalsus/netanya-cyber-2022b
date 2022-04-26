var loginStage = 1;
var isCaptchaSolved = false;
var aws_access_key = "AKIAIOSFODNN7EXAMPLE";
var aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

var loginButton = document.getElementById("loginButton");
var loadingButton = document.getElementById("loadingButton");

function showLoadingButton() {
    loginButton.style.display = "none";
    loadingButton.style.display = "block";
}

function hideLoadingButton() {
    loginButton.style.display = "block";
    loadingButton.style.display = "none";
}

if (_shouldSolveCaptcha) {
    $("#recaptcha-container").show();
}

$('#successModal').on('hidden.bs.modal', function () {
    //window.top.location.reload(true);
    $("#IDPLogin").submit();
});

function showErrorToast(errCode) {
    if (errCode.length > 0) {
        var err = errorCodeToErrorMessage(errCode);
        $("#errMsg").html(err);
        $("#errorMessageAlert").show();
    } else {
        $("#errMsg").html("");
        $("#errorMessageAlert").hide();
    }
}

function recaptchaCallback() {
    console.log('Captcha passed');
    isCaptchaSolved = true;
    doFirstStageLogin();
}

function initiateLoginSequence() {
    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: {
            option: "credential",
            initiateLoginSequence: "true",
            isAjax: "true"
        },
        success: function (data) {
            shouldSolveCaptcha = data.isCaptchaNeeded;
            if (shouldSolveCaptcha) {
                $("#recaptcha-container").show();
            } else {
                $("#recaptcha-container").hide();
                _shouldSolveCaptcha = false;
            }
            if (data.isError) {
                if (data.errorCode == ERROR_AUTH_TYPE_NOT_FOUND) {
                    startSecondStageSequence(data.authTypes);
                    loginStage = 2;
                } else {
                    $("#usernamePasswordForm").fadeIn();
                    loginStage = 1;
                }
            } else {
                $("#usernamePasswordForm").fadeIn();
                loginStage = 1;
            }
        }
    });
}

function onStageFinish(authType){
    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: {
            option: "credential",
            isAjax: "true",
            authType: authType
        },
        success: function (data) {
            if (data.isError) {
                if (data.errorCode == ERROR_AUTH_TYPE_NOT_FOUND) {
                    startSecondStageSequence(data.authTypes);
                    loginStage = loginStage + 1;
                } else {
                    initiateLoginSequence();
                }
            } else {
                document.forms[0].submit();
            }
        }
    });
}

function startSecondStageSequence(authTypes) {
    $("#usernamePasswordForm").hide();
    $("#ldapPasswordCard").hide();
    $("#smsOTPCard").hide();
    $("#emailOTPCard").hide();
    $("#smartphoneOTPCard").hide();
    $("#emergencyPasswordCard").hide();

    if (authTypes.includes(LDAP_PASSWORD_CLASS)) {
        $("#ldapPasswordCard").show();
        if (authTypes.length == 1)
            startLDAPPasswordLoginSequence();
    }

    if (authTypes.includes(SMS_OTP_CLASS)) {
        $("#smsOTPCard").show();
        if (authTypes.length == 1)
            startSmsLoginSequence();
    }
	if (authTypes.includes(EMAIL_OTP_CLASS)) {
        $("#emailOTPCard").show();
        if (authTypes.length == 1)
            startEmailLoginSequence();
    }
    if (authTypes.includes(SMARTPHONE_CLASS)) {
        $("#smartphoneOTPCard").show();
        if (authTypes.length == 1)
            startSmartphoneLoginSequence();
    }
    if (authTypes.includes(EMERGENCY_PASSWORD_CLASS)) {
        $("#emergencyPasswordCard").show();
        if (authTypes.length == 1)
            startHelpdeskPasswordLoginSequence();
    }
    $("#secondFactorDiv").fadeIn();
}

function doFirstStageLogin() {
    if (_shouldSolveCaptcha && !isCaptchaSolved) {
        grecaptcha.execute();
    } else {
        if (isCaptchaSolved)
            $("#recaptcha-container").hide();
        username = $("#" + PARM_USERID).val();
        if (username == null || username == undefined || username.trim().length == 0) {
            showErrorToast("Invalid user name");
            return;
        }
	sessionStorage.setItem("username", username);
        // var password = $("#" + PARM_PASSWORD).val();
        // if (password == null || password == undefined || password.trim().length == 0) {
        //     showErrorToast("Invalid password");
        //     return;
        // }
        showLoadingButton();

        var post_data = {
            "option": "credential",
            "isAjax": "true",
            "g-recaptcha-response": grecaptcha.getResponse()
        };

        post_data[PARM_USERID] = sessionStorage.getItem("username");
        // post_data[PARM_PASSWORD] = password;

        $.ajax({
            type: 'POST',
            url: serverUrl,
            data: post_data,
            success: function (data) {
                if (data.isError) {
                    hideLoadingButton();
                    if (data.errorCode == ERROR_AUTH_TYPE_NOT_FOUND) {
                        startSecondStageSequence(data.authTypes);
                    } else
                        showErrorToast(data.errorCode);
                } else {
                    document.forms[0].submit();
                }
            }
        });
    }
}

function onLoginButtonClick() {
    // Clear error
    showErrorToast("");
    switch (loginStage) {
        case 1:
            doFirstStageLogin();
            break;
        case 2:
            break;
        default:
            doFirstStageLogin();
            break;
    }
}

$("#usernamePasswordForm").keydown(function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        onLoginButtonClick();
    }
});

$('#loginButton').on('click', function (e) {
    e.preventDefault();
    onLoginButtonClick();
});
initiateLoginSequence();


var smsOtpCardClicked = false;

function onSmsSent() {   	
	$("#smsSendLoading").hide();
    $("#smsOtpInputDiv").fadeIn();
    $("#smsOtp").focus();
}

function startSmsLoginSequence() {	    
    if (!smsOtpCardClicked){
		smsOtpCardClicked = true;
		$("#smsOTPCard").attr("active", true);
		$("#smsOTPCard").attr("enabled", null);
        $("#ldapPasswordCard").attr("enabled", false);
		$("#emergencyPasswordCard").attr("enabled", false);
		$("#smartphoneOTPCard").attr("enabled", false);
		$("#emailOTPCard").attr("enabled", false);
		$("#smsSendLoading").show();
		$("#smsCardInstructions").hide();
        $.ajax({
            type: 'POST',
            url: serverUrl,
            data: {
                option: "credential",
                isAjax: "true",
                authType: SMS_OTP_CLASS
            },
            success: function (data) {
                if (data.isError) {
                    showErrorToast(data.errorCode);
					$("#smsSendLoading").hide();
					startLDAPPasswordLoginSequence();
                } else {
					if (data.otpDestMasked != null && data.otpDestMasked.length > 0){						
						$("#smsDestMasked").html(data.otpDestMasked);
						onSmsSent();
					}else{
						setTimeout(function(){startSmsLoginSequence()}, 1500);						
					}
                }
            }
        });
	}
}

$("#smsCardClick").click(function (e) {
    e.preventDefault();
    startSmsLoginSequence();
});


function onSmsOtpSubmit() {
    $("#smsOtpError").hide();
    var otp = $("#smsOtp").val();
    if (otp == null || otp == undefined || otp.trim().length == 0) {
        $("#smsOtpErrorMsg").html(errorCodeToErrorMessage(ERROR_INVALID_INPUT));
        $("#smsOtpError").show();
        return;
    }
    $("#smsLoginButton").hide();
    $("#smsLoginLoadingButton").show();

    var post_data = {
        "option": "credential",
        "isAjax": "true",
        "authType": SMS_OTP_CLASS,
        "g-recaptcha-response": grecaptcha.getResponse()
    };

    post_data[OTP_REQUEST_PARAM] = otp;

    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: post_data,
        success: function (data) {
            if (data.isError) {
                $("#smsLoginButton").show();
                $("#smsLoginLoadingButton").hide();
                if (data.errorCode == ERROR_INTRUDER_DETECTED) {
                    showErrorToast(errorCodeToErrorMessage(data.errorCode));
                    $("#smsOTPCard").attr("enabled", false);
                    $("#smsOtpInputDiv").hide();
                    $("#smsCardInstructions").show();
                } else {
                    $("#smsOtpErrorMsg").html(errorCodeToErrorMessage(data.errorCode));
                    $("#smsOtpError").show();
                }
            } else {
                $("#authType").val(SMS_OTP_CLASS);
                onStageFinish(SMS_OTP_CLASS);
            }
        }
    });
}

$("#smsOtp").keydown(function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        onSmsOtpSubmit();
    }
});

$("#smsLoginButton").click(function (e) {
    e.preventDefault();
    onSmsOtpSubmit();
});


//EMAIL OTP 

var emailOtpCardClicked = false;

function onEmailSent() {   	
	$("#emailSendLoading").hide();
    $("#emailOtpInputDiv").fadeIn();
    $("#emailOtp").focus();
}

function startEmailLoginSequence() {	    
    if (!emailOtpCardClicked){
		emailOtpCardClicked = true;
		$("#emailOTPCard").attr("active", true);
		$("#emailOTPCard").attr("enabled", null);
        $("#ldapPasswordCard").attr("enabled", false);
		$("#smsOTPCard").attr("enabled", false);
		$("#emergencyPasswordCard").attr("enabled", false);
		$("#smartphoneOTPCard").attr("enabled", false);
		$("#emailSendLoading").show();
		$("#emailCardInstructions").hide();
        $.ajax({
            type: 'POST',
            url: serverUrl,
            data: {
                option: "credential",
                isAjax: "true",
                authType: EMAIL_OTP_CLASS
            },
            success: function (data) {
                if (data.isError) {
                    showErrorToast(data.errorCode);
                } else {
					if (data.otpDestMasked != null && data.otpDestMasked.length > 0){						
						$("#emailDestMasked").html(data.otpDestMasked);
						onEmailSent();
					}else{
						setTimeout(function(){startEmailLoginSequence()}, 1500);						
					}
                }
            }
        });
	}
}

$("#emailCardClick").click(function (e) {
    e.preventDefault();
    startEmailLoginSequence();
});


function onEmailOtpSubmit() {
    $("#emailOtpError").hide();
    var otp = $("#emailOtp").val();
    if (otp == null || otp == undefined || otp.trim().length == 0) {
        $("#emailOtpErrorMsg").html(errorCodeToErrorMessage(ERROR_INVALID_INPUT));
        $("#emailOtpError").show();
        return;
    }
    $("#emailLoginButton").hide();
    $("#emailLoginLoadingButton").show();

    var post_data = {
        "option": "credential",
        "isAjax": "true",
        "authType": EMAIL_OTP_CLASS,
        "g-recaptcha-response": grecaptcha.getResponse()
    };

    post_data[OTP_REQUEST_PARAM] = otp;

    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: post_data,
        success: function (data) {
            if (data.isError) {
                $("#emailLoginButton").show();
                $("#emailLoginLoadingButton").hide();
                if (data.errorCode == ERROR_INTRUDER_DETECTED) {
                    showErrorToast(errorCodeToErrorMessage(data.errorCode));
                    $("#emailOTPCard").attr("enabled", false);
                    $("#emailOtpInputDiv").hide();
                    $("#emailCardInstructions").show();
                } else {
                    $("#emailOtpErrorMsg").html(errorCodeToErrorMessage(data.errorCode));
                    $("#emailOtpError").show();
                }
            } else {
                $("#authType").val(EMAIL_OTP_CLASS);
                onStageFinish(EMAIL_OTP_CLASS);
            }
        }
    });
}

$("#emailOtp").keydown(function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        onEmailOtpSubmit();
    }
});

$("#emailLoginButton").click(function (e) {
    e.preventDefault();
    onEmailOtpSubmit();
});

// End of EMAIL OTP


// Smartphone OTP

var pushSent = false;

function onPushSent() {
    $("#smartphonePushDiv").fadeIn();
    $("#smartphoneOTPCard").attr("active", true);
    $("#ldapPasswordCard").attr("enabled", false);
    $("#smsOTPCard").attr("enabled", false);
	$("#emailOTPCard").attr("enabled", false);
    $("#emergencyPasswordCard").attr("enabled", false);
    $("#smartphoneCardInstructions").hide();
    checkSmartphoneApproval();
}

function startSmartphoneLoginSequence() {
    if (!pushSent)
        $.ajax({
            type: 'POST',
            url: serverUrl,
            data: {
                option: "credential",
                isAjax: "true",
                authType: SMARTPHONE_CLASS
            },
            success: function (data) {
                if (data.isError) {
                    showErrorToast(data.errorCode);
                } else {
                    pushSent = true;
                    $("#smsDestMasked").html(data.otpDestMasked);
                    onPushSent();
                }
            }
        });
}

$("#smartphoneCardClick").click(function (e) {
    e.preventDefault();
    startSmartphoneLoginSequence();
});

var shouldCheckAppApproval = true;

function checkSmartphoneApproval() {
    if (!shouldCheckAppApproval)
        return;

    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: {
            option: "credential",
            isAjax: "true",
            authType: SMARTPHONE_CLASS
        },
        success: function (data) {
            if (data.isError) {
                if (data.errorCode == ERROR_LOGON_IN_PROGRESS) {
                    setTimeout(function () {
                        checkSmartphoneApproval();
                    }, 1000);
                } else {
                    showErrorToast(errorCodeToErrorMessage(data.errorCode));
                    $("#smartphonePushDiv").hide();
                    $("#smartphoneOtpInputDiv").hide();
                    $("#smartphoneOTPCard").attr("enabled", false);
                }
            } else {
                $("#authType").val(SMARTPHONE_CLASS);
                onStageFinish(SMARTPHONE_CLASS);
            }
        }
    });
}

$("#smartphoneOfflineAuthButton").click(function (e) {
    e.preventDefault();
    shouldCheckAppApproval = false;
    $("#smartphonePushDiv").hide();
    $("#smartphoneOtpInputDiv").fadeIn();
    $("#smartphoneOtp").focus();
});


function onSmartohoneOtpSubmit() {
    $("#smartphoneOtpError").hide();
    var otp = $("#smartphoneOtp").val();
    if (otp == null || otp == undefined || otp.trim().length == 0) {
        $("#smartphoneOtpErrorMsg").html(errorCodeToErrorMessage(ERROR_INVALID_INPUT));
        $("#smartphoneOtpError").show();
        return;
    }
    $("#smartphoneLoginButton").hide();
    $("#smartphoneLoginLoadingButton").show();

    var post_data = {
        "option": "credential",
        "isAjax": "true",
        "authType": SMARTPHONE_CLASS,
        "g-recaptcha-response": grecaptcha.getResponse()
    };

    post_data[OTP_REQUEST_PARAM] = otp;

    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: post_data,
        success: function (data) {
            if (data.isError) {
                $("#smartphoneLoginButton").show();
                $("#smartphoneLoginLoadingButton").hide();
                if (data.errorCode == ERROR_INTRUDER_DETECTED) {
                    showErrorToast(errorCodeToErrorMessage(data.errorCode));
                    $("#smartphoneOTPCard").attr("enabled", false);
                    $("#smartphonePushDiv").hide();
                    $("#smartphoneOtpInputDiv").hide();
                    $("#smartphoneCardInstructions").show();
                }
                $("#smartphoneOtpErrorMsg").html(errorCodeToErrorMessage(data.errorCode));
                $("#smartphoneOtpError").show();
            } else {
                $("#authType").val(SMARTPHONE_CLASS);
                onStageFinish(SMARTPHONE_CLASS);
            }
        }
    });
}


$("#smartphoneOtp").keydown(function (e) {
    if (e.keyCode == 13) {
        e.preventDefault();
        onSmartohoneOtpSubmit();
    }
});


$("#smartphoneLoginButton").click(function (e) {
    e.preventDefault();
    onSmartohoneOtpSubmit();
});

$(".loginMethodCard").click(function () {
    $("#securityCodeChoiceTitle").fadeOut();
});

// End of smartphone OTP

// LDAP Password

var LDAPPasswordCardClicked = false;
function startLDAPPasswordLoginSequence(){

    if (!LDAPPasswordCardClicked) {
        $("#ldapPasswordInputDiv").fadeIn();
        $("#ldapPasswordCard").attr("active", true);
        $("#emergencyPasswordCard").attr("enabled", false);
        $("#smartphoneOTPCard").attr("enabled", false);
        $("#smsOTPCard").attr("enabled", false);
        $("#emailOTPCard").attr("enabled", false);
        $("#ldapPasswordCardInstructions").hide();
        $("#ldapPassword").focus();
        LDAPPasswordCardClicked = true;
    }

}

$("#ldapPasswordCard").click(function (e) {
    e.preventDefault();
    startLDAPPasswordLoginSequence();
});

function onLDAPPaswordSubmit() {
    $("#ldapPasswordError").hide();
    var ldapPassword = $("#ldapPassword").val();
    if (ldapPassword == null || ldapPassword == undefined || ldapPassword.trim().length == 0) {
        $("#ldapPasswordErrorMsg").html(errorCodeToErrorMessage(ERROR_INVALID_INPUT));
        $("#ldapPasswordError").show();
        return;
    }
    $("#ldapPasswordLoginButton").hide();
    $("#ldapPasswordLoginLoadingButton").show();


    var post_data = {
        "option": "credential",
        "isAjax": "true",
        "authType": LDAP_PASSWORD_CLASS,
        "g-recaptcha-response": grecaptcha.getResponse()
    };

    post_data[PASSWORD_REQUEST_PARAM] = ldapPassword;
    post_data[PARM_USERID] = sessionStorage.getItem("username");

    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: post_data,
        success: function (data) {
            if (data.isError) {
                $("#ldapPasswordLoginButton").show();
                $("#ldapPasswordLoginLoadingButton").hide();
                if (data.errorCode == ERROR_INTRUDER_DETECTED) {
                    showErrorToast(errorCodeToErrorMessage(data.errorCode));
                    $("#ldapPasswordCard").attr("enabled", false);
                    $("#ldapPasswordInputDiv").hide();
                    $("#ldapPasswordCardInstructions").show();
                } else {
                    $("#ldapPasswordErrorMsg").html(errorCodeToErrorMessage(data.errorCode));
                    $("#ldapPasswordError").show();
                }
            } else {
                $("#authType").val(LDAP_PASSWORD_CLASS);
                //document.forms[0].submit();
                onStageFinish(LDAP_PASSWORD_CLASS);
            }
        }
    });
}

// EMERGENCY Password

var emergencyPasswordCardClicked = false;

function startHelpdeskPasswordLoginSequence() {
    if (!emergencyPasswordCardClicked) {
        $("#emergencyPasswordInputDiv").fadeIn();
        $("#emergencyPasswordCard").attr("active", true);
        $("#ldapPasswordCard").attr("enabled", false);
        $("#smartphoneOTPCard").attr("enabled", false);
        $("#smsOTPCard").attr("enabled", false);
		$("#emailOTPCard").attr("enabled", false);
        $("#emergencyPasswordCardInstructions").hide();
        $("#helpdeskOtp").focus();
        emergencyPasswordCardClicked = true;
    }
}

$("#emergencyPasswordCard").click(function (e) {
    e.preventDefault();
    startHelpdeskPasswordLoginSequence();
});

function onHelpdeskPaswordSubmit() {
    $("#helpdeskOtpError").hide();
    var otp = $("#helpdeskOtp").val();
    if (otp == null || otp == undefined || otp.trim().length == 0) {
        $("#helpdeskOtpErrorMsg").html(errorCodeToErrorMessage(ERROR_INVALID_INPUT));
        $("#helpdeskOtpError").show();
        return;
    }
    $("#helpdeskLoginButton").hide();
    $("#helpdeskLoginLoadingButton").show();


    var post_data = {
        "option": "credential",
        "isAjax": "true",
        "authType": EMERGENCY_PASSWORD_CLASS,
        "g-recaptcha-response": grecaptcha.getResponse()
    };

    post_data[OTP_REQUEST_PARAM] = otp;

    $.ajax({
        type: 'POST',
        url: serverUrl,
        data: post_data,
        success: function (data) {
            if (data.isError) {
                $("#helpdeskLoginButton").show();
                $("#helpdeskLoginLoadingButton").hide();
                if (data.errorCode == ERROR_INTRUDER_DETECTED) {
                    showErrorToast(errorCodeToErrorMessage(data.errorCode));
                    $("#emergencyPasswordCard").attr("enabled", false);
                    $("#emergencyPasswordInputDiv").hide();
                    $("#emergencyPasswordCardInstructions").show();
                } else {
                    $("#helpdeskOtpErrorMsg").html(errorCodeToErrorMessage(data.errorCode));
                    $("#helpdeskOtpError").show();
                }
            } else {
                $("#authType").val(EMERGENCY_PASSWORD_CLASS);
                onStageFinish(EMERGENCY_PASSWORD_CLASS);
            }
        }
    });
}

function onloadCallback() {
    console.log('Reached google recaptcha onload callback');
    grecaptcha.render('recaptcha-container', {
        'sitekey': '6Lf8mAMfAAAAAMt0wUwUzR_l3KDfzfLEaT6M2Pf_',
        'callback': recaptchaCallback,
        'badge': document.dir == "ltr" ? "bottomright" : "bottomleft"
    });
}

$( document ).ready(function() {

    $("#ldapPassword").keydown(function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            onLDAPPaswordSubmit();
        }
    });

    $("#ldapPasswordLoginButton").click(function (e) {
        e.preventDefault();
        onLDAPPaswordSubmit();
    });

	$("#helpdeskOtp").keydown(function (e) {
		if (e.keyCode == 13) {
			e.preventDefault();
			onHelpdeskPaswordSubmit();
		}
	});

	$("#helpdeskLoginButton").click(function (e) {
		e.preventDefault();
		onHelpdeskPaswordSubmit();
	});

	var curDate = new Date();
	$("#copyRightYear").html(curDate.getFullYear());
	
	$("#smsSendLoading").hide();
	$("#emailSendLoading").hide();
		
});


function onPasswordChangeLinkClicked(){
	window.open("https://account.netanya.ac.il/sspr/public/forgottenpassword?locale=" + $("html").attr("lang"), "_blank");
}
