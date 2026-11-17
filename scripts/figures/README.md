# Figure models (docs/design/new-figures.md)

Blender scripts that build Relic's new figures from simple shapes with flat cel colours, and render them.
`kit.py` holds the shared pieces (materials, shapes, the camera and light); one file a figure.

    blender --background --factory-startup --python scripts/figures/knight.py -- out/knight.png [yaw degrees]

A figure faces -Y, stands on z = 0, is measured in metres (a hero about 1.9 tall) and renders with no backdrop.
Checked with Blender 5.2. First passes only: see the spec for what is decided and what is not.
