var root = '../../';

require.config({

    baseUrl: 'js/libs',

    paths: {

        FAOSTAT_DOWNLOAD_SELECTOR: root + 'faostat-download-selector',
        faostat_download_selector: root

    }

});

require(['FAOSTAT_DOWNLOAD_SELECTOR'], function(FSDWLDS) {
    var fsdwls = new FSDWLDS();
    fsdwls.init({
        placeholder_id: 'placeholder'
    });
});