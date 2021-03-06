tQuery.register('MinecraftItems', function(opts){
	// handle parameters
	this._opts	= tQuery.extend(opts, {
		url	: 'images/items/items.png'
	});
	function getMaterial(image, transparent){
		var tex		= new THREE.Texture(image);
		tex.magFilter	= THREE.NearestFilter;
		tex.minFilter	= THREE.NearestFilter;
		tex.format	= transparent ? THREE.RGBAFormat : THREE.RGBFormat;
		tex.needsUpdate	= true;
		var material	= new THREE.MeshBasicMaterial({
			map		: tex,
			transparent	: transparent ? true : false
		});
		return material;
	}
	function uvmap (geometry, face, x, y, w, h, rotateBy){
		rotateBy	= rotateBy !== undefined ? rotateBy : 0;
		var uvs		= geometry.faceVertexUvs[0][face];
		var tileU	= x;
		var tileV	= y;
		
		uvs[ (0 + rotateBy) % 4 ].u = tileU * tileUvW;
		uvs[ (0 + rotateBy) % 4 ].v = tileV * tileUvH;
		uvs[ (1 + rotateBy) % 4 ].u = tileU * tileUvW;
		uvs[ (1 + rotateBy) % 4 ].v = tileV * tileUvH + h * tileUvH;
		uvs[ (2 + rotateBy) % 4 ].u = tileU * tileUvW + w * tileUvW;
		uvs[ (2 + rotateBy) % 4 ].v = tileV * tileUvH + h * tileUvH;
		uvs[ (3 + rotateBy) % 4 ].u = tileU * tileUvW + w * tileUvW;
		uvs[ (3 + rotateBy) % 4 ].v = tileV * tileUvH;
	};
	/**
	 * Create the geometry of the sprite 'id'. It is cached
	 * @returns {THREE.Geometry} geometry built
	*/
	function getGeometry( id ){
		if( geometries[id] !== undefined )	return geometries[id];
		
		function getSides(x, y){
			var ix = Math.floor(id % 16)*16;
			var iy = Math.floor(id / 16)*16;
			
			var alphaPx	= (x+1) < 16 ? imd[((x+1)+y*16)*4+3] : 0;
			var alphaNx	= (x-1) >= 0 ? imd[((x-1)+y*16)*4+3] : 0;
			var alphaPy	= (y+1) < 16 ? imd[(x+(y-1)*16)*4+3] : 0;
			var alphaNy	= (y-1) >= 0 ? imd[(x+(y+1)*16)*4+3] : 0;
			
			return {
				px: !alphaPx, // Turns zero and undefined to true
				nx: !alphaNx,
				py: !alphaPy,
				ny: !alphaNy,
				pz: true,
				nz: true
			};
		};

		var imgdata	= context.getImageData(Math.floor(id % 16)*16, Math.floor(id / 16)*16, 16, 16);
		var imd		= imgdata.data;			
		var geometry	= new THREE.Geometry();
		
		for(var x=0; x < 16; x++) {
			for(var y=0; y < 16; y++) {
				// is this pixel transparent, skip it
				if( imd[(x+y*16)*4+3] === 0)	continue;
				
				var voxel	= new THREE.CubeGeometry(1, 1, 2, 1, 1, 1, undefined, getSides(x, y));
				// TODO why is there a texture here ????
				// - this is a single pixel. get the pixel and set the color
				// - this may fix the anti alias issue
				for(var i=0; i < voxel.faceVertexUvs[0].length; i++) { // Fix color of voxel
					uvmap(voxel, i, Math.floor(id % 16)*16+x, Math.floor(id / 16)*16+y, 1, 1);
				}
				
				// TODO what is this ... it seems a translation but why ?
				console.assert(voxel.vertices.length)
				for(var i=0; i < voxel.vertices.length; i++) { // Fix voxel's position
					voxel.vertices[i].x += +(x-15/2);	// what is this 7.5 ? why not 8 ? as in 16/2
					voxel.vertices[i].y += -(y-15/2);
				}
				THREE.GeometryUtils.merge(geometry, voxel);
			}
		}
		// if the geometry is fully transparent, unset it - NOTE: this is set to null, not unsigned
		if( geometry.faces.length === 0 )	geometry = null;
		// cache the result
		geometries[id]	= geometry;
		// return the result
		return geometry;
	};
	function createMeshItem (id) {
		var geometry	= getGeometry(id);
		if( !geometry )	return null;
		var mesh	= new THREE.Mesh( geometry, material );
		return tQuery(mesh).geometry().scaleBy(1/16).back();
	};	

	// create the canvas element
	var canvas	= document.createElement('canvas');
	canvas.width	= 256;
	canvas.height	= 256;
	var context	= canvas.getContext('2d');
	var material	= getMaterial(canvas, true);
	// init some constants
	var tileUvW	= 1/canvas.width;
	var tileUvH	= 1/canvas.height;
	

	var geometries	= [];

	// load the image
	var items	= new Image();
	items.onload	= function(){
		// clear the canvas - TODO is this necessary ?
		context.clearRect(0, 0, canvas.width, canvas.height);
		// draw the loaded image to the canvas
		context.drawImage(items, 0, 0);
		// trigger the 'load' event
		this.trigger("load");
	}.bind(this);
	items.src = this._opts.url;
	
	// setup the public function
	this.createMesh		= createMeshItem;
	this.createGeometry	= getGeometry;
});

// make it eventable
tQuery.MicroeventMixin(tQuery.MinecraftItems.prototype);
