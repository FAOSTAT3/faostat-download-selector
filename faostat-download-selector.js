define(['jquery',
        'handlebars',
        'text!faostat_download_selector/html/templates.html',
        'i18n!faostat_download_selector/nls/translate',
        'bootstrap',
        'sweet-alert'], function ($, Handlebars, templates, translate) {

    'use strict';

    function SELECTOR() {

        this.CONFIG = {
            lang            :   'E',
            placeholder_id  :   'placeholder',
            tabs :   [
                {
                    label: 'Countries',
                    rest: 'http://faostat3.fao.org/wds/rest/procedures/usp_GetListBox/faostatdb/GT/1/1/E'
                },
                {
                    label: 'Regions',
                    rest: 'http://faostat3.fao.org/wds/rest/procedures/usp_GetListBox/faostatdb/GT/1/2/E'
                },
                {
                    label: 'Special Groups',
                    rest: 'http://faostat3.fao.org/wds/rest/procedures/usp_GetListBox/faostatdb/GT/1/3/E'
                }
            ]
        };

    }

    SELECTOR.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'E';

        /* Load main structure. */
        var source = $(templates).filter('#main_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            tab_headers_id: 'tab_headers_1',
            tab_contents_id: 'tab_contents_id_1',
            go_to_label: translate.go_to,
            clear_all_label: translate.clear_all,
            select_all_label: translate.select_all,
            select_all_button_id: 'select_all_button_1',
            clear_all_button_id: 'select_all_button_2'
        };
        var html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

    };

    return SELECTOR;

});