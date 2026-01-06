/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2496120988")

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "number2738207373",
    "max": null,
    "min": null,
    "name": "avg_views",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "hidden": false,
    "id": "number224670618",
    "max": null,
    "min": null,
    "name": "reach",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2496120988")

  // remove field
  collection.fields.removeById("number2738207373")

  // remove field
  collection.fields.removeById("number224670618")

  return app.save(collection)
})
