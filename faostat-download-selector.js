define(['jquery',
        'handlebars',
        'text!faostat_download_selector/html/templates.html',
        'i18n!faostat_download_selector/nls/translate',
        'bootstrap',
        'jstree',
        'sweet-alert'], function ($, Handlebars, templates, translate) {

    'use strict';

    function SELECTOR() {

        this.CONFIG = {
            lang: 'E',
            placeholder_id: 'placeholder',
            suffix: 'area',
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
            tab_headers_id: 'tab_headers_' + this.CONFIG.suffix,
            tab_contents_id: 'tab_contents_' + this.CONFIG.suffix,
            go_to_label: translate.go_to,
            clear_all_label: translate.clear_all,
            select_all_label: translate.select_all,
            select_all_button_id: 'select_all_button_' + this.CONFIG.suffix,
            clear_all_button_id: 'clear_all_button_' + this.CONFIG.suffix
        };
        var html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Add tab header and content. */
        for (var i = 0 ; i < this.CONFIG.tabs.length ; i++) {
            this.add_tab_header(this.CONFIG.tabs[i].label);
            this.add_tab_content();
        }

        /* Show the first tab. */
        $($('#tab_headers_' + this.CONFIG.suffix).find('a')[0]).tab('show');

    };

    SELECTOR.prototype.load_codelist = function() {

        $('#tree').jstree({

            'plugins': ['unique', 'search', 'state', 'types', 'wholerow'],

            'core': {

                'data': function(object, callback) {

                    $.ajax({

                        type: 'GET',
                        url: 'http://faostat3.fao.org/wds/rest/procedures/usp_GetListBox/faostatdb/GT/1/1/E',

                        success: function (response) {

                            /* Cast the response to JSON, if needed. */
                            var json = response;
                            if (typeof json == 'string')
                                json = $.parseJSON(response);

                            /* Cast array to objects */
                            var payload = [];
                            for (var i = 0 ; i < json.length ; i++)
                                payload.push({
                                    id: json[i][0],
                                    text: json[i][1],
                                    type: json[i][3]
                                });

                            callback.call(this, payload);

                        }

                    });

                }
            }

        });

    };

    SELECTOR.prototype.add_tab_header = function(tab_header_label) {
        var source = $(templates).filter('#tab_header_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            role_id: 'role_' + this.CONFIG.suffix,
            tab_header_label: tab_header_label
        };
        var html = template(dynamic_data);
        $('#tab_headers_' + this.CONFIG.suffix).append(html);
    };

    SELECTOR.prototype.add_tab_content = function() {
        var source = $(templates).filter('#tab_content_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            id: 'role_' + this.CONFIG.suffix
        };
        var html = template(dynamic_data);
        $('#tab_contents_' + this.CONFIG.suffix).append(html);
    };

    return SELECTOR;

});