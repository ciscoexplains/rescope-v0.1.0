/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2496120988")

  // add field
  collection.fields.addAt(28, new Field({
    "hidden": false,
    "id": "bool2599192861",
    "name": "is_verified",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2496120988")

  // remove field
  collection.fields.removeById("bool2599192861")

  return app.save(collection)
})
