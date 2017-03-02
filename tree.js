/* 
 * Tree module
 * ©SWD
 */

var tree = {
	
	time: {
		processing: 0,
		rendering: 0,
		total: 0
	},
	
	pz: null,
	me: null,
	data: null,
	root: null,
	graph: null,
	
	render: function(){

		var 
			timeStart,
			timeMiddle,
			timeEnd;
		
		timeStart = new Date();

		this.loaderShow();
		
		this.root = this.findRoot().node;
		this.graph = this.buildTree(this.root);
		//lg(JSON.stringify(this.graph));

		this.processGraph();
		
		//lg(this.graph);
		//return false;
		
		timeMiddle = new Date();
		
		this.refresh(this.renderGraph(this.graph));
		
		timeEnd = new Date();
		
		// calculate processing and rendering times
		this.time.processing = (timeMiddle.getTime() - timeStart.getTime()) / 1000;
		this.time.rendering = (timeEnd.getTime() - timeMiddle.getTime()) / 1000;
		
		this.bindViewControls();
		this.centerOnId(tree.me.id);

		this.loaderHide();
		
		this.time.total = (timeEnd.getTime() - timeStart.getTime()) / 1000;

		lg('Processing tree in ' + this.time.processing + '; rendered in ' + this.time.rendering + '; total time ' + this.time.total);
	},
	
	renderGraph: function(graph){
		var html = {cards: [], paths: []};
		
		html.cards.push( this.createCard(graph.person, graph.person.x, graph.person.y) );
		
		var d = Math.round((graph.partners.male.length - 1) * ph / 2) * -1;

		for (var i = 0; i < graph.partners.male.length; i++)
		{
			var 
				pid = graph.partners.male[i].partner.person.id,
				expand = (this.hasFather(pid) || this.hasMother(pid) || this.hasPartner(pid, graph.person.id)) ? true : false;
			
			html.cards.push( this.createCard(graph.partners.male[i].partner.person, graph.partners.male[i].partner.person.x, graph.partners.male[i].partner.person.y, expand) );
			
			var 
				childFirst = false,
				childLast  = false;
			
			for (var j = 0; j < graph.partners.male[i].children.length; j++)
			{
				var temp = this.renderGraph(graph.partners.male[i].children[j]);
				html.cards = html.cards.concat( temp.cards );
				html.paths = html.paths.concat( temp.paths );
				
				// connect children to parent
				var 
					p1 = this.getCardCenter(graph.partners.male[i].children[j].person),
					p2 = {x: p1.x, y: p1.y - nlh};
					
				html.paths.push( this.connectPoints(p1, p2, 0, 0) );
				
				if (j === 0) childFirst = graph.partners.male[i].children[j].person;
				if ((j !== 0) && (j === (graph.partners.male[i].children.length - 1))) childLast = graph.partners.male[i].children[j].person;
			}
			
			// connect partners
			html.paths.push( this.connectPartners(graph.person, graph.partners.male[i].partner.person, d, i) );
			
			// connect parent to child/ren
			if (graph.partners.male[i].children.length > 0)
			{
				var 
					p = this.getCardCenter(graph.partners.male[i].partner.person),
					p3 = {x: p.x + nwh + nsh, y: p.y + d},
					p4 = {x: p.x + nwh + nsh, y: p.y + nlh};
				
				html.paths.push( this.connectPoints(p3, p4, 0, 0) );
			}
			
			// connect first with last child
			if (childFirst && childLast)
			{
				var
					p1 = this.getCardCenter(childFirst),
					p2 = this.getCardCenter(childLast);
			
				p1.y -= nlh;
				p2.y -= nlh;
			
				html.paths.push( this.connectPoints(p1, p2, 0, 0) );
			}

			d += ph;
		}
		
		var d = Math.round((graph.partners.female.length - 1) * ph / 2) * -1;
		
		for (var i = 0; i < graph.partners.female.length; i++)
		{
			var 
				pid = graph.partners.female[i].partner.person.id,
				expand = (this.hasFather(pid) || this.hasMother(pid) || this.hasPartner(pid, graph.person.id)) ? true : false;
			
			html.cards.push( this.createCard(graph.partners.female[i].partner.person, graph.partners.female[i].partner.person.x, graph.partners.female[i].partner.person.y, expand) );
			
			var 
				childFirst = false,
				childLast  = false;
			
			for (var j = 0; j < graph.partners.female[i].children.length; j++)
			{
				var temp = this.renderGraph(graph.partners.female[i].children[j]);
				html.cards = html.cards.concat( temp.cards );
				html.paths = html.paths.concat( temp.paths );
				
				// connect children to parent
				var 
					p1 = this.getCardCenter(graph.partners.female[i].children[j].person),
					p2 = {x: p1.x, y: p1.y - nlh};
					
				html.paths.push( this.connectPoints(p1, p2, 0, 0) );
				
				if (j === 0) childFirst = graph.partners.female[i].children[j].person;
				if ((j !== 0) && (j === (graph.partners.female[i].children.length - 1))) childLast = graph.partners.female[i].children[j].person;
			}
			
			// connect partners
			html.paths.push( this.connectPartners(graph.person, graph.partners.female[i].partner.person, d, i) );
			
			// connect parent to child/ren
			if (graph.partners.female[i].children.length > 0)
			{
				var 
					p = this.getCardCenter(graph.partners.female[i].partner.person),
					p3 = {x: p.x - nwh - nsh, y: p.y + d},
					p4 = {x: p.x - nwh - nsh, y: p.y + nlh};
				
				html.paths.push( this.connectPoints(p3, p4, 0, 0) );
			}
			
			// connect first with last child
			if (childFirst && childLast)
			{
				var
					p1 = this.getCardCenter(childFirst),
					p2 = this.getCardCenter(childLast);
			
				p1.y -= nlh;
				p2.y -= nlh;
			
				html.paths.push( this.connectPoints(p1, p2, 0, 0) );
			}

			d += ph;
		}
		
		return html;
	},
	
	processGraph: function(){
		this.graph = pt(this.graph, {
			width: nw,
			spacing: ns,
			height: nl
		});
	},
	
	buildTree: function(person){
		var
			rel = this.data.relationships,
			children = [],
			graph = {
				person: person,
				partners: {
					male: [],
					female: [],
					total: 0
				}
			};
		
		graph.person = person;
				
		// find partners
		for (var i = 0; i < rel.length; i++)
		{
			if ((rel[i].a === person.id) && (rel[i].r === 'partnerF' || rel[i].r === 'partnerM'))
			{
				children = this.findChildren(person.id, rel[i].b);
				var 
					childGraph = [],
					otherPartners = this.hasPartner(rel[i].b, graph.person.id),
					p = this.findPersonById(rel[i].b);
				
				for (var j = 0; j < children.length; j++)
				{
					childGraph.push(this.buildTree(children[j]));
				}
				
				p.safeDelete = ((childGraph.length === 0) && (otherPartners === false) && (p.me !== '1'));

				if (rel[i].r === 'partnerF')
				{

					graph.partners.female.push({
						partner: {
							person: p
						},
						children: childGraph
					});
				}
				else
				{
					graph.partners.male.push({
						partner: {
							person: p
						},
						children: childGraph
					});
				}
				graph.partners.total++;
			}
		}
		
		graph.person.safeDelete = ((graph.partners.total === 0) && (graph.person.me !== '1'));
		
		return graph;		
	},
	
	findPartners: function(a){
		var partners = [];
		
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];

			if ((rel.a === a) && (rel.r === 'partnerM' || rel.r === 'partnerF')) partners.push(this.findPersonById(rel.b));
		}
		
		return partners;
	},

	findChildren: function(partnerA, partnerB, justIds){
		var 
			children = [],
			childrenA = [],
			childrenB = [];
	
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];

			if ((rel.a === partnerA) && (rel.r === 'son' || rel.r === 'daughter')) childrenA.push(rel.b);
			if ((rel.a === partnerB) && (rel.r === 'son' || rel.r === 'daughter')) childrenB.push(rel.b);
		}
		
		for (var i = 0; i < childrenA.length; i++)
		{
			if (childrenB.hasValue(childrenA[i]))
			{
				if (justIds !== undefined)
				{
					children.push(childrenA[i]);
				}
				else
				{
					children.push(this.findPersonById(childrenA[i]));
				}
			}
		}

		// sort children - males first
		children.sort(function(a, b){
			if (a.gender === b.gender) return 0;
			return (a.gender === 'm') ? -1 : 1;
		});
		
		return children;
	},
	
	createCard: function(person, x, y, expand){
		if (person.placeholder === '1') return false;
		
		var 
			icon = null,
			invite = null,
			dates = person.dobStr,
			add = null,
			edit = null;
			
		if (person.me === '0')
		{
			invite = {
				tag: 'image',
				attributes: [
					{name: 'x', value: x + 152},
					{name: 'y', value: y - 20},
					{name: 'class', value: 'nc-invite'},
					{name: 'width', value: 40},
					{name: 'height', value: 40},
					{name: 'xlink:href', value: 'assets/img/ico-invite.png'}
				],
				text: '',
				children: [
					{
						tag: 'title',
						attributes: [],
						text: 'Invite this person',
						children: []
					}
				]
			};
		}
			
		if (person.me === '1')
		{
			if (person.alive === '0')
			{
				icon = {
					tag: 'image',
					attributes: [
						{name: 'x', value: x + nw - 19},
						{name: 'y', value: y + nh - 20},
						{name: 'width', value: 19},
						{name: 'height', value: 18},
						{name: 'xlink:href', value: 'assets/img/logo.black.png'}
					],
					text: '',
					children: [
						{
							tag: 'title',
							attributes: [],
							text: 'Deceased',
							children: []
						}
					]
				};
				dates += ' - ' + person.dodStr;
			}
			else
			{
				icon = {
					tag: 'image',
					attributes: [
						{name: 'x', value: x + nw - 19},
						{name: 'y', value: y + nh - 20},
						{name: 'width', value: 19},
						{name: 'height', value: 18},
						{name: 'xlink:href', value: 'assets/img/logo.png'}
					],
					text: '',
					children: [
						{
							tag: 'title',
							attributes: [],
							text: 'Member',
							children: []
						}
					]
				};
			}
		}
		
		if (expand)
		{
			expand = {
				tag: 'image',
				attributes: [
					{name: 'x', value: x},
					{name: 'y', value: y - 20},
					{name: 'class', value: 'nc-expand'},
					{name: 'width', value: 20},
					{name: 'height', value: 20},
					{name: 'xlink:href', value: 'assets/img/ico-expand.png'}
				],
				text: '',
				children: [
					{
						tag: 'title',
						attributes: [],
						text: 'View ' + person.name + '\'s tree',
						children: []
					}
				]
			};
		}
		else
		{
			expand = null;
		}
		
		edit = {
			tag: 'image',
			attributes: [
				{name: 'x', value: x + 230},
				{name: 'y', value: y - 20},
				{name: 'xlink:href', value: 'assets/img/ico-edit.png'},
				{name: 'class', value: 'nc-edit'},
				{name: 'width', value: 40},
				{name: 'height', value: 40}
			],
			text: '',
			children: [{
					tag: 'title',
					attributes: [],
					text: 'Edit details',
					children: []
			}]
		};
		
		out = {
			tag: 'g',
			attributes: [
				{name: 'id', value: 'nc-' + person.id},
				{name: 'class', value: 'name-card'},
				{name: 'data-safe-delete', value: person.safeDelete},
				{name: 'data-placeholder', value: '0'},
				{name: 'data-gender', value: person.gender},
				{name: 'data-name', value: person.name},
				{name: 'data-id', value: person.id}
			],
			text: '',
			children: [
				{
					tag: 'rect',
					attributes: [
						{name: 'x', value: x},
						{name: 'y', value: y},
						{name: 'class', value: 'nc-bg'},
						{name: 'width', value: 250},
						{name: 'height', value: 80},
						{name: 'fill', value: '#ffffff'},
						{name: 'stroke-width', value: 2},
						{name: 'stroke-linecap', value: 'butt'},
						{name: 'stroke-linejoin', value: 'round'},
						{name: 'stroke-dasharray', value: '0 250 0 80 250 80'},
						{name: 'rx', value: 0},
						{name: 'ry', value: 0}
					],
					text: '',
					children: []
				},
				{
					tag: 'text',
					attributes: [
						{name: 'x', value: x + 80},
						{name: 'y', value: y + 30},
						{name: 'class', value: 'nc-text'},
						{name: 'fill', value: '#919191'},
						{name: 'font-weight', value: 500},
						{name: 'font-size', value: '17px'},
						{name: 'text-anchor', value: 'start'}
					],
					text: person.name,
					children: []
				},
				{
					tag: 'text',
					attributes: [
						{name: 'x', value: x + 80},
						{name: 'y', value: y + 65},
						{name: 'class', value: 'nc-dob'},
						{name: 'fill', value: '#a0a0a0'},
						{name: 'font-weight', value: 400},
						{name: 'font-size', value: '12px'},
						{name: 'text-anchor', value: 'start'}
					],
					text: (person.alive === '1') ? person.dobStr : person.dobStr + ' - ' + person.dodStr,
					children: []
				},
				{
					tag: 'image',
					attributes: [
						{name: 'x', value: x + 10},
						{name: 'y', value: y + 10},
						{name: 'xlink:href', value: person.image},
						{name: 'class', value: 'nc-photo'},
						{name: 'width', value: 60},
						{name: 'height', value: 60}
					],
					text: '',
					children: []
				},
				{
					tag: 'image',
					attributes: [
						{name: 'x', value: x + 192},
						{name: 'y', value: y - 20},
						{name: 'xlink:href', value: 'assets/img/ico-add.png'},
						{name: 'class', value: 'nc-add'},
						{name: 'width', value: 40},
						{name: 'height', value: 40}
					],
					text: '',
					children: [{
							tag: 'title',
							attributes: [],
							text: 'Add new relatives',
							children: []
					}]
				}
			]
		};
		
		if (person.canEdit === true) out.children.push(edit);
		if (invite !== null) out.children.push(invite);
		if (icon !== null) out.children.push(icon);
		if (expand !== null) out.children.push(expand);
		
		return out;
	},
		
	findPersonById: function(id){
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (this.data.persons[i].id === id) return this.data.persons[i];
		}
	},
	
	findPersonInTree: function(id, graph){
		if (graph.person.id === id) return graph.person;
		
		for (var i = 0; i < graph.partners.male.length; i++)
		{
			if (graph.partners.male[i].partner.person.id === id) return graph.partners.male[i].partner.person;
			
			for (var j = 0; j < graph.partners.male[i].children.length; j++)
			{
				var result = this.findPersonInTree(id, graph.partners.male[i].children[j]);
				
				if (result !== false) return result;
			}
		}
		
		for (var i = 0; i < graph.partners.female.length; i++)
		{
			if (graph.partners.female[i].partner.person.id === id) return graph.partners.female[i].partner.person;
			
			for (var j = 0; j < graph.partners.female[i].children.length; j++)
			{
				var result = this.findPersonInTree(id, graph.partners.female[i].children[j]);
				
				if (result !== false) return result;
			}
		}
		
		return false;
	},
	
	getNameById: function(id){
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (this.data.persons[i].id === id) return this.data.persons[i].name;
		}
	},
	
	findRoot: function(node, level){
		var 
			m = null,
			f = null;
		
		if (node === undefined) node = this.me;
		if (level === undefined) level = 0;
		
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			if ((rel.a === node.id) && (rel.r === 'mother')) m = this.findRoot(this.findPersonById(rel.b), level + 1);
			if ((rel.a === node.id) && (rel.r === 'father')) f = this.findRoot(this.findPersonById(rel.b), level + 1);
		}
		
		if ((m === null) && (f === null)) return {node: node, level: level};
		if ((m === null) && (f !== null)) return f;
		if ((m !== null) && (f === null)) return m;

		return (m.level > f.level) ? m : f;
	},
	
	findMe: function(){
		for (var i = 0; i < this.data.persons.length; i++)
		{
			if (this.data.persons[i].me === '1')
			{
				this.me = this.data.persons[i];
				break;
			}
		}
	},
	
	hasFather: function(id){
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			
			if ((rel.a === id) && (rel.r === 'father'))
			{
				var person = this.findPersonById(rel.b);
				if (person.placeholder === '0') return true;
			}
		}
		return false;
	},
	
	hasMother: function(id){
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			
			if ((rel.a === id) && (rel.r === 'mother'))
			{
				var person = this.findPersonById(rel.b);
				if (person.placeholder === '0') return true;
			}
		}
		return false;
	},
	
	hasPartner: function(id, not){
		var possible = ['partnerF', 'partnerM'];
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];

			if (not !== undefined)
			{
				if ((rel.a === id) && (rel.b !== not) && (possible.hasValue(rel.r))) return true;
			}
			else
			{
				if ((rel.a === id) && (possible.hasValue(rel.r))) return true;
			}
		}
		return false;
	},
	
	getPartners: function(id){
		var 
			possible = ['partnerF', 'partnerM'],
			partners = [];
	
		for (var i = 0; i < this.data.relationships.length; i++)
		{
			var rel = this.data.relationships[i];
			
			if ((rel.a === id) && (possible.hasValue(rel.r))) partners.push({id: rel.b, name: this.getNameById(rel.b)});
		}
		return partners;
	},
	
	getCardCenter: function(obj){
		return {x: obj.x + nwh, y: obj.y + nhs};
	},
	
	connectPartners: function(a, b, d, i){
		var 
			p1 = this.getCardCenter(a),
			p2 = this.getCardCenter(b);
		
		if (a.placeholder === '1')
		{
			p1.x += (a.gender === 'm') ? (nwh + nsh) : (nwh + nsh) * - 1;
		}
		
		if (b.placeholder === '1')
		{
			p2.x += (b.gender === 'm') ? (nwh + nsh) : (nwh + nsh) * - 1;
		}

		return this.connectPoints(p1, p2, d, i);
	},
	
	connectPoints: function(a, b, d, index){
		var 
			p1 = {x: a.x, y: a.y + d},
			p2 = {x: b.x, y: b.y + d},
			color = (index < 4) ? styles['path' + (index + 1)] : style = styles.path4;
		
		return {
			tag: 'path',
			attributes: [
				{name: 'data-holder', value: d},
				{name: 'd', value: 'M ' + p1.x + ' ' + p1.y + ' L ' + p2.x + ' ' + p2.y + ' z'},
				{name: 'stroke-width', value: '3'},
				{name: 'stroke', value: color}
			],
			text: '',
			children: []
		};
	},
	
	centerOnId: function(id){
		var
			p = this.findPersonInTree(id, this.graph),
			c = tree.getCardCenter(p),
			realZoom = tree.pz.getSizes().realZoom;

		//lg(c);

		tree.pz.pan({  
			x: -(c.x*realZoom)+(tree.pz.getSizes().width/2),
			y: -(c.y*realZoom)+(tree.pz.getSizes().height/2)
		});
	},
	
	search: function(){
		var 
			input = $('.tree-search').val(),
			html = '';

		for (var i = 0; i < tree.data.persons.length; i++)
		{
			var p = tree.data.persons[i];

			if (p.name.toLowerCase().indexOf(input.toLowerCase()) > -1)
			{
				html += '<li data-id="' + p.id + '">' + p.name + '</li>';
			}
		}

		if (html === '') html = '<li class="none">No results found</li>';

		$('.tree-search-holder > ul').remove();
		$('.tree-search-holder').append('<ul>' + html + '</ul>');
	},
	
	searchResultClick: function(obj){
		var id = obj.attr('data-id');
		
		if ($('.name-card[data-id="' + id + '"]').length > 0)
		{
			this.centerOnId(id);
			this.searchClose();
		}
		else
		{
			this.me = tree.findPersonById(id);
			this.render();
		}
	},
	
	searchClose: function(){
		$('.tree-search').val('');
		$('.tree-search-holder > ul').remove();
	},
	
	listenerAddPerson: function(e){
		
		e.preventDefault();
		e.stopPropagation();
		
		var personId = $(this).parent().attr('data-id');
		tree.centerOnId(personId);

		$('.tree-add').attr('data-person-id', '0');
		$('.tree-add').attr('data-relation-id', personId);
		showOptions(personId, $(this));
	},
	
	listenerEditPerson: function(e){
		e.preventDefault();
		e.stopPropagation();

		var person = tree.findPersonById($(this).parent().attr('data-id'));
		
		tree.centerOnId(person.id);
		tree.clearDetailFields();

		$('.tree-add').attr('data-person-id', person.id);
		$('.tree-add').attr('data-relation-id', '0');

		// preload data
		$('.tree-add img').attr('src', person.image);
		$('.tree-add h1').html('Edit ' + person.name);
		$('.tree-add .hide-on-edit').hide();
		$('.tree-add input[name="fname"]').val(person.fname);
		$('.tree-add input[name="mname"]').val(person.mname);
		$('.tree-add input[name="lname"]').val(person.lname);
		$('.tree-add input[name="dob"]').val(person.dobStr);
		$('.tree-add input[name="pob"]').val(person.pob);
		$('.tree-add input[name="email"]').val(person.email);
		$('.tree-add .btn-safe-delete').show();
		
		if (person.alive === '1')
		{
			$('.tree-add input[name="alive"][value="1"]').prop('checked', true);
			$('.tree-add input[name="dod"]').parent().hide();
		}
		else
		{
			$('.tree-add input[name="alive"][value="0"]').prop('checked', true);
			$('.tree-add input[name="dod"]').val(person.dodStr);
			$('.tree-add input[name="dod"]').parent().show();
		}
		
		$('.tree-add').modal('show');
	},
	
	listenerExpandTree: function(e){
		var id = $(this).parent().attr('data-id');
	
		tree.me = tree.findPersonById(id);
		tree.render();
	},
	
	listenerInvite: function(e){
		var 
			id = $(this).parent().attr('data-id'),
			person = tree.findPersonById(id);
		
		$('.invite input[name="email"]')
			.attr('placeholder', person.name + "'s email address")
			.val(person.email);
	
		$('.invite h1').html('Invite ' + person.name + ' to join My Life\'s Legacy');
		
		$('.invite')
			.attr('data-id', id)
			.modal('show');
	},
	
	removeListeners: function(){	
		$('.name-card .nc-add').each(function(){
			this.removeEventListener('click', tree.listenerAddPerson, false);
		});
		
		$('.name-card .nc-edit').each(function(){
			this.removeEventListener('click', tree.listenerEditPerson, false);
		});
		
		$('.name-card .nc-expand').each(function(){
			this.removeEventListener('click', tree.listenerExpandTree, false);
		});
	},
	
	clearDetailFields: function(){
		$('.tree-add img').attr('src', 'assets/img/profile.na.png');
		$('.tree-add input[name="fname"]').val('');
		$('.tree-add input[name="lname"]').val('');
		$('.tree-add input[name="mname"]').val('');
		$('.tree-add input[name="email"]').val('');
		$('.tree-add input[name="dob"]').val('');
		$('.tree-add input[name="dod"]').val('');
		$('.tree-add input[name="pob"]').val('');
		$('.tree-add select[name="father_id"]').html('');
		$('.tree-add select[name="mother_id"]').html('');
		$('.qq-upload-list').html('');
		$('.tree-add input[name="image"]').val('');
	},
		
	refresh: function(html){
	
		// refresh tree
		this.clearNode('viewport');
		
		var connections = tree.makeTag({tag: 'g', attributes: [{name: 'class', value: 'connections'}], text: '', children: html.paths});

		var view = document.getElementById('viewport');
		if (connections !== '') view.appendChild(connections);
		
		html.cards.forEach(function(card){
			var childNode = tree.makeTag(card);
			if (childNode !== '') view.appendChild(childNode);
		});
		
		// fix text width on name cards
		/*
		$('.name-card > .nc-text').each(function(){
			fitText($(this), 160);
		});
		*/

		// add event listeners for card controls
		var items = document.getElementsByClassName('nc-add');
		for (var i = 0; i < items.length; i++)
		{
			items[i].addEventListener('touchend', tree.listenerAddPerson, false);
			items[i].addEventListener('click', tree.listenerAddPerson, false);
		}
		
		var items = document.getElementsByClassName('nc-edit');
		for (var i = 0; i < items.length; i++)
		{
			items[i].addEventListener('touchend', tree.listenerEditPerson, false);
			items[i].addEventListener('click', tree.listenerEditPerson, false);
		}
		
		var items = document.getElementsByClassName('nc-expand');
		for (var i = 0; i < items.length; i++)
		{
			items[i].addEventListener('touchend', tree.listenerExpandTree, false);
			items[i].addEventListener('click', tree.listenerExpandTree, false);
		}
		
		var items = document.getElementsByClassName('nc-invite');
		for (var i = 0; i < items.length; i++)
		{
			items[i].addEventListener('touchend', tree.listenerInvite, false);
			items[i].addEventListener('click', tree.listenerInvite, false);
		}
		
	},
	
	clearNode: function(id){
		var node = document.getElementById(id);
		while (node.firstChild)
		{
			node.removeChild(node.firstChild);
		}
	},
	
	makeTag: function(o){

		if (o === false) return '';
		
		var node = document.createElementNS("http://www.w3.org/2000/svg", o.tag);
		
		o.attributes.forEach(function(a){
			var ns = (a.name === 'xlink:href') ? 'http://www.w3.org/1999/xlink' : null;
			node.setAttributeNS(ns, a.name, a.value);
		});
		
		o.children.forEach(function(child){
			node.appendChild(tree.makeTag(child));
		});
		
		if (o.text !== '')
		{
			node.appendChild(document.createTextNode(o.text));
		}

		return node;
	},
	
	loaderShow: function(){
		$('#tree').css('opacity', 0);
		$('.svg-container .loading').css('opacity', 1);
	},
	
	loaderHide: function(){
		$('.svg-container .loading').css('opacity', 0);
		$('#tree').animate({ opacity: 1 }, animationSpeed);
		
		/*
		sleep(1500).then(function(){
			$('.svg-container .loading').css('opacity', 0);
			$('#tree').animate({ opacity: 1 }, animationSpeed);
		});
		*/
	},
	
	bindViewControls: function(){
		tree.pz = svgPanZoom('#tree',{
			contain: false,
			fit: false,
			center: true,
			maxZoom: 2,
			minZoom: 0.1,
			//zoom: 
			dblClickZoomEnabled: false,
			//mouseWheelZoomEnabled: false,
			beforePan: function(oldPan, newPan){
				var stopHorizontal = false
				  , stopVertical = false
				  , gutterWidth = 100
				  , gutterHeight = 100
					// Computed variables
				  , sizes = this.getSizes()
				  , leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth
				  , rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom)
				  , topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight
				  , bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom);

				customPan = {};
				customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x));
				customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y));

				return customPan;
			},
			onZoom: function(level){
				slider.slider('setValue', level);
			}
		});
		tree.pz.zoom(0.75);
	},
	
	fetchTree: function(treeData){
		if (treeData === undefined)
		{
			request({
				data: {
					act: 'FamilyTree-fetchTree'
				},
				success: function(r){
					tree.data = r.tree;
					if (tree.me === null) tree.findMe();
					tree.render();
				}
			});
		}
		else
		{
			this.data = treeData;
			if (this.me === null) this.findMe();
			this.render();
		}
	},
	
	resize: function(){
		$('svg').css('height', $(window).height() - 61);
		if (tree.pz !== null)
		{
			tree.pz.resize();
			tree.pz.center();
		}
	},
	
	init: function(treeData){
		this.resize();
		this.removeListeners();
		this.fetchTree(treeData);
	}
};

$(document).ready(function(){
	tree.init();
	
	slider = $('.slider').slider({
		orientation: 'vertical',
		min: 0.1,
		max: 2,
		step: 0.01,
		value: 1,
		handle: 'custom',
		tooltip: 'hide'
	});
});

$(window).resize(function(){
	tree.resize();
});

/*** Tree search ***/

$(document).on('click', '.tree-search', function(e){
	e.stopPropagation();
});

$(document).on('keyup', '.tree-search', function(){
	tree.search();
});

$(document).on('click', '.tree-search-holder ul li', function(){
	tree.searchResultClick($(this));
});

$(document).on('click', 'body', function(){
	tree.searchClose();
});

/*** View controls ***/

$(document).on('click', '.view-control .zoom-in', function(){
	tree.pz.zoomIn();
	slider.slider('setValue', tree.pz.getZoom());
});

$(document).on('click', '.view-control .zoom-out', function(){
	tree.pz.zoomOut();
	slider.slider('setValue', tree.pz.getZoom());
});

$(document).on('click', '.view-control .zoom-reset', function(){
	tree.pz.resetZoom();
});

$(document).on('click', '.view-control .pan-top', function(){
	tree.pz.panBy({x: 0, y: -200});
});

$(document).on('click', '.view-control .pan-left', function(){
	tree.pz.panBy({x: -200, y: 0});
});

$(document).on('click', '.view-control .pan-right', function(){
	tree.pz.panBy({x: 200, y: 0});
});

$(document).on('click', '.view-control .pan-bottom', function(){
	tree.pz.panBy({x: 0, y: 200});
});

$(document).on('click', '.view-control .pan-home', function(){
	tree.centerOnId(tree.me.id);
});

$(document).on('slide', '.slider', function(e){
	tree.pz.zoom(e.value);
});

$(document).on('change', '.slider', function(e){
	tree.pz.zoom(e.value.newValue);
});

/*** Tree manipulation ***/

$(document).on('click', '.modal-person .ico-clear', function(){
	closeOptions();
});

$(document).on('change', '.tree-add select[name="relationship"]', function(){
	var r = $(this).val();
	
	switch (r)
	{
		case 'mother': 
			$('.tree-add select[name="gender"]').val('f');
			$('.parent').hide();
			break;
			
		case 'father':
			$('.tree-add select[name="gender"]').val('m'); 
			$('.parent').hide();
			break;
			
		case 'sister':
			$('.tree-add select[name="gender"]').val('f');
			$('.parent').hide();
			break;
			
		case 'brother':
			$('.tree-add select[name="gender"]').val('m');
			$('.parent').hide();
			break;
			
		case 'son':
			$('.tree-add select[name="gender"]').val('m');
			$('.parent').show();
			break;
			
		case 'daughter':
			$('.tree-add select[name="gender"]').val('f');
			$('.parent').show();
			break;
			
		case 'wife':
			$('.tree-add select[name="gender"]').val('f');
			$('.parent').hide();
			break;
			
		case 'ex-wife':
			$('.tree-add select[name="gender"]').val('f');
			$('.parent').hide();
			break;
			
		case 'husband':
			$('.tree-add select[name="gender"]').val('m');
			$('.parent').hide();
			break;
			
		case 'ex-husband':
			$('.tree-add select[name="gender"]').val('m');
			$('.parent').hide();
			break;
	}
});

$(document).on('click', '.btn-save-person', function(){
	var personId = $('.tree-add').attr('data-person-id');
	var relationId = $('.tree-add').attr('data-relation-id');
	
	if ((personId === '0') && !relationshipCheck()) return false;
	
	request({
		data: {
			act: 'FamilyTree-save',
			person_id: personId,
			relation_id: relationId,
			father_id: $('select[name="father_id"]').val(),
			mother_id: $('select[name="mother_id"]').val(),
			details: {
				fname: $('.tree-add input[name="fname"]').val(),
				mname: $('.tree-add input[name="mname"]').val(),
				lname: $('.tree-add input[name="lname"]').val(),
				gender: $('.tree-add select[name="gender"]').val(),
				relationship: $('.tree-add select[name="relationship"]').val(),
				dob: $('.tree-add input[name="dob"]').val(),
				dod: $('.tree-add input[name="dod"]').val(),
				pob: $('.tree-add input[name="pob"]').val(),
				email: $('.tree-add input[name="email"]').val(),
				alive: $('.tree-add input[name="alive"]:checked').val(),
				image: $('.tree-add input[name="image"]').val()
			}
		},
		success: function(r){
			$('.tree-add').modal('hide');
			tree.init(r.tree);
		}
	});
});

$(document).on('click', '.btn-add', function(){
	closeOptions();
	
	var 
		person = tree.findPersonById($('.tree-add').attr('data-relation-id')),
		partners = tree.getPartners(person.id, person.gender),
		hideRelation = $('.tree-add').attr('data-hide-relation'),
		relationship = $(this).attr('data-relation');
	
	tree.clearDetailFields();
	
	// preload data
	$('.tree-add .hide-on-edit').show();
	$('.tree-add h1').html('Add ' + relationship);
	$('.tree-add select[name="relationship"]').val($(this).attr('data-relation'));
	$('.tree-add select[name="gender"]').val($(this).attr('data-gender'));
	$('.tree-add input[name="alive"][value="1"]').prop('checked', true);
	$('.tree-add input[name="dod"]').parent().hide();
	$('.tree-add .btn-safe-delete').hide();
	
	//disable relationship options
	$('.tree-add select[name="relationship"] option').prop('disabled', false);
	
	if (hideRelation !== '')
	{
		hideRelation = hideRelation.split(',');
		for (var i = 0; i < hideRelation.length; i++)
		{
			$('.tree-add select[name="relationship"] option[value="' + hideRelation[i] + '"]').prop('disabled', true);
		}
	}
	
	switch (relationship)
	{
		case 'son':
		case 'daughter':
			$('.parent').show();
			
			var html = '';
			for (var i = 0; i < partners.length; i++)
			{
				html += '<option value="' + partners[i].id + '">' + partners[i].name + '</option>';
			}
			
			if (person.gender === 'm')
			{
				$('.parent label').html('Mother');
				$('.parent select[name="father_id"]').hide();
				$('.parent select[name="mother_id"]').html(html).show();
			}
			else
			{
				$('.parent label').html('Father');
				$('.parent select[name="mother_id"]').hide();
				$('.parent select[name="father_id"]').html(html).show();
			}
			break;
			
		case 'brother':
		case 'sister':
		case 'partner':
			$('.parent').hide();
			break;
			
	}
	
	$('.tree-add').modal('show');
});

$(document).on('click', '.btn-safe-delete', function(e){
	e.preventDefault();
	
	var 
		id = $('.tree-add').attr('data-person-id'),
		sd = $('#nc-' + id).attr('data-safe-delete');
		
	if (sd === 'true')
	{
		pp('Delete person from you tree', 'Are you sure you want to remove this person from your tree? You will not be able to undo this.', [
			{
				label: 'Yes',
				cls: ' btn-success',
				callback: function(){
					request({
						data: {
							act: 'FamilyTree-delete',
							person_id: id
						},
						success: function(r){
							if (r.status === true)
							{
								$('.tree-add').modal('hide');
								tree.init(r.tree);
							}
							else
							{
								pp('Delete person from family tree', r.message);
							}
						}
					});
				}
			},
			{label: 'Cancel', cls: '', callback: function(){}}
		]);
		return false;
	}

	pp('Warning', 'This person cannot be safely deleted from your tree. It either has children or multiple partners, please remove them first.');
});

$(document).on('click', 'input[name="alive"]', function(){
	if ($(this).val() === '0')
	{
		$('input[name="dod"]').parent().show();
		$('input[name="email"]').parent().hide();
	}
	else
	{
		$('input[name="dod"]').parent().hide();
		$('input[name="email"]').parent().show();
	}
});

$(document).on('mousedown', '.svg-container', function(){
	$(this).addClass('grabbing');
});

$(document).on('mouseup', '.svg-container', function(){
	$(this).removeClass('grabbing');
});

/*** Share/Invite ***/

$(document).on('click', '.btn-share', function(){
	FB.ui({
		method: 'share',
		quote: "I joined My Life's Legacy, A place where every life is worth remembering, and now you can too. Try it!",
		href: global.siteURL + 'family-tree/' + global.user.personId + '/' + global.user.name.toURL()
	}, function(r){});
});

$(document).on('click', '.btn-invite', function(){
	var 
		id = $('.invite').attr('data-id'),
		email = $('.invite input[name="email"]').val();
		
	if (email !== '')
	{
		$('.invite').modal('hide');
		request({
			data: {
				act: 'FamilyTree-invite',
				id: id,
				email: email
			},
			success: function(r){
				pp('Invitation to ' + global.siteName, r.message);
			}
		});
	}
	else
	{
		pp('Error', 'Please fill in the email address field');
	}
});

var uploader = new qq.FileUploader({
	element: document.getElementById('file-uploader'),
	action: 'index_ajax.php?act=general-upload',
	debug: false,
	multiple: false,
	uploadButtonText: '<span class="ico ico-file-upload"></span>Upload picture',
	disableDefaultDropzone: true,
	onComplete: function(id, filename, response){
		if (response.success === true)
		{
			$('.tree-add input[name="image"]').val(response.path);
		}
		else
		{
			$('.qq-upload-failed-text').html(response.error);
		}
	}
});