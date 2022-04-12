var translationKeyAttName = "translation_key";
var translationsJsonsLocation = '/nidp/netanya/translations';
var translationsJsonsSuffix = '.json';

curLangTranslations = undefined;

function translatePage(lang){
    if (lang == "he")
        $("html").attr("dir","rtl");
    else
        $("html").attr("dir","ltr");
    $.getJSON( translationsJsonsLocation + "/" + lang + translationsJsonsSuffix, function( translationsData ) {
        curLangTranslations = translationsData;
        $('['+translationKeyAttName+']').each(function(index){
            var curTranslationKey = this.getAttribute(translationKeyAttName);
            var translatedValue = translationsData[curTranslationKey];
            if (translatedValue != undefined && translatedValue != null && translatedValue.length > 0)
                this.innerHTML = translatedValue;
            else
                this.innerHTML = curTranslationKey;
        });

        // set the page title
        $(document).attr("title", translationsData.PAGE_TITLE);

    });
}

$( document ).ready(function() {
    translatePage("he");
    $(".langChooseOption").click(function(){
        var langCode = this.getAttribute("lang_code");
        $("html").attr("lang",langCode);
        translatePage(langCode);
    });
});
