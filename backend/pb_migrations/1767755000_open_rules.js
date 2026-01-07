/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const candidates = app.findCollectionByNameOrId("candidates");
    const trends = app.findCollectionByNameOrId("search_trends");

    // Update candidates rules
    candidates.listRule = "";
    candidates.viewRule = "";
    candidates.createRule = "";
    candidates.updateRule = "";
    candidates.deleteRule = "";

    // Update search_trends rules
    trends.listRule = "";
    trends.viewRule = "";
    trends.createRule = "";
    trends.updateRule = "";
    trends.deleteRule = "";

    app.save(candidates);
    app.save(trends);

    return;
}, (app) => {
    const candidates = app.findCollectionByNameOrId("candidates");
    const trends = app.findCollectionByNameOrId("search_trends");

    // Revert candidates rules
    candidates.listRule = null;
    candidates.viewRule = null;
    candidates.createRule = null;
    candidates.updateRule = null;
    candidates.deleteRule = null;

    // Revert search_trends rules
    trends.listRule = null;
    trends.viewRule = null;
    trends.createRule = null;
    trends.updateRule = null;
    trends.deleteRule = null;

    app.save(candidates);
    app.save(trends);
})
