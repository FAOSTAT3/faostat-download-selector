define(function() {

    var config = {
        paths: {
            FAOSTAT_DOWNLOAD_SELECTOR: 'faostat-download-selector',
            faostat_download_selector: '../'
        },
        shim: {
            bootstrap: {
                deps: ['jquery']
            }
        }
    };

    return config;

});