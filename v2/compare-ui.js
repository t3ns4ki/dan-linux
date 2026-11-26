/* Copyright (C) 2026 Dan (t3ns4ki). SPDX-License-Identifier: GPL-3.0-or-later */
(function(root){
 'use strict';
 const app=root.DanV2,container=app.$('#compare-source-links');
 for(const [label,url] of app.compareSources){const link=document.createElement('a');link.href=url;link.textContent=label;link.target='_blank';link.rel='noopener';container.append(link);}
})(globalThis);
