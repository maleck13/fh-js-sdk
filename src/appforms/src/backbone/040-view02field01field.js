FieldView = Backbone.View.extend({

  className: 'fh_appform_field_area',
  errMessageContainer: ".fh_appform_errorMsg",
  requiredClassName: "fh_appform_required",
  errorClassName: "fh_appform_error",
  addInputButtonClass: ".fh_appform_addInputBtn", //TODO Need to remove hard-coded strings for these names
  removeInputButtonClass: ".fh_appform_removeInputBtn",
  fieldWrapper: "<div />",
  wrapper: '<div id="wrapper_<%= fieldId %>_<%= index %>" title="<%= helpText %>"><%= title %><%= input %><div class="fh_appform_errorMsg hidden"></div></div>',
  title: '<label class="<%= required %> fh_appform_field_title"><%= title %> </label><%= helpText %>',
  input: "<input class='fh_appform_field_input' data-field='<%= fieldId %>' data-index='<%= index %>' type='<%= inputType %>'/> ",
  instructions: '<p class="fh_appform_field_instructions"><%= helpText %></p>',
  fh_appform_fieldActionBar: "<div class='fh_appform_fieldActionBar'><button class='fh_appform_addInputBtn fh_appform_special_button fh_appform_button_action'>Add Input</button><button class='fh_appform_special_button fh_appform_removeInputBtn fh_appform_button_action'>Remove Input</button></div>",
  events: {
    "change": "contentChanged",
    "blur input,select,textarea": "validate",
    "click .fh_appform_addInputBtn": "onAddInput",
    "click .fh_appform_removeInputBtn": "onRemoveInput"
  },
  onAddInput: function() {
    this.addElement();
    this.checkActionBar();
  },
  onRemoveInput: function() {
    this.removeElement();
    this.checkActionBar();
  },
  checkActionBar: function() {
    var curNum = this.curRepeat;
    var maxRepeat = this.maxRepeat;
    var minRepeat = this.initialRepeat;
    if (curNum < maxRepeat) {
      this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).show();
    } else {
      this.$fh_appform_fieldActionBar.find(this.addInputButtonClass).hide();
    }

    if (curNum > minRepeat) {
      this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).show();
    } else {
      this.$fh_appform_fieldActionBar.find(this.removeInputButtonClass).hide();
    }
  },
  removeElement: function() {
    var curRepeat = this.curRepeat;
    var lastIndex = curRepeat - 1;
    this.getWrapper(lastIndex).remove();
    this.curRepeat--;
  },
  renderTitle: function(index) {
    var name = this.model.getName();
    var title = name;
    var required = "";
    var helpText = "";
    if (this.model.isRepeating()) {
      title += " (" + (index + 1) + ") ";
    }
    if (this.initialRepeat > 1) {
      if (index < this.initialRepeat) {
        required = this.requiredClassName;
      }
    } else {
      if (this.model.isRequired()) {
        required = this.requiredClassName;
      }
    }
    if (this.model.isRequired() && index < this.initialRepeat) {
      required = this.requiredClassName;
    }
    if (index == 0) {
      helpText = this.renderHelpText();
    }
    return _.template(this.title, {
      "title": title,
      "helpText": helpText,
      "required": required
    });
  },
  renderInput: function(index) {
    var fieldId = this.model.getFieldId();
    var type = this.type || "text";
    return _.template(this.input, {
      "fieldId": fieldId,
      "index": index,
      "inputType": type
    });
  },
  renderEle: function(titleHtml, inputHtml, index) {
    var helpText = this.model.getHelpText();
    var fieldId = this.model.getFieldId();
    return _.template(this.wrapper, {
      "fieldId": fieldId,
      "index": index,
      "helpText": helpText,
      "title": titleHtml,
      "input": inputHtml
    });
  },
  renderHelpText: function() {
    var helpText = this.model.getHelpText();

    if(typeof helpText == "string" && helpText.length > 0){
      return _.template(this.instructions, {
        "helpText": helpText
      });
    } else {
      return "";
    }

  },
  addElement: function() {
    var index = this.curRepeat;
    var titleHtml = this.renderTitle(index);
    var inputHtml = this.renderInput(index);
    var eleHtml = this.renderEle(titleHtml, inputHtml, index);
    this.$fieldWrapper.append(eleHtml);
    this.curRepeat++;
    this.onElementShow(index);

  },
  onElementShow: function(index) {

  },
  render: function() {
    var self = this;
    this.initialRepeat = 1;
    this.maxRepeat = 1;
    this.curRepeat = 0;
    if (this.model.isRepeating()) {
      this.initialRepeat = this.model.getMinRepeat();
      this.maxRepeat = this.model.getMaxRepeat();
    }
    for (var i = 0; i < this.initialRepeat; i++) {
      this.addElement();
    }

    this.$el.append(this.$fieldWrapper);
    this.$el.append(this.$fh_appform_fieldActionBar);
    this.$el.attr("data-field", this.model.getFieldId());

    // add to dom
    this.options.parentEl.append(this.$el);

    this.show();

    // force the element to be initially hidden
    if (this.$el.hasClass("hide")) {
      this.hide(true);
    }
    // populate field if Submission obj exists
    var submission = this.options.formView.getSubmission();
    if (submission) {
      this.submission = submission;
      this.submission.getInputValueByFieldId(this.model.get('_id'), function(err, res) {
        console.log(err, res);
        self.value(res);
      });
    }
    this.checkActionBar();
    this.onRender();
  },
  onRender: function() {

  },
  // TODO: cache the input element lookup?
  initialize: function() {
    _.bindAll(this, 'dumpContent', 'clearError', 'onAddInput', 'onRemoveInput');

    // if (this.model.isRequired()) {
    //   this.$el.addClass('required');
    // }
    this.$fieldWrapper = $(this.fieldWrapper);
    this.$fh_appform_fieldActionBar = $(this.fh_appform_fieldActionBar);
    // only call render once. model will never update
    this.render();
  },

  dumpContent: function() {
    console.log("Value changed :: " + JSON.stringify(this.value()));

  },

  getTopView: function() {
    var view = this.options.parentView;
    var parent;
    do {
      parent = view.options.parentView;
      if (parent) {
        view = parent;
      }
    } while (parent);
    return view;
  },

  validate: function(e) {
    if (App.config.validationOn) {
      var self = this;
      var target = $(e.currentTarget);
      var index = target.data().index;
      var val = this.valueFromElement(index);
      var fieldId = this.model.getFieldId();
      this.model.validate(val, function(err, res) { //validation
        if (err) {
          console.error(err);
        } else {
          var result = res["validation"][fieldId];
          if (!result.valid) {
            var errorMessages = result.errorMessages.join(", ");
            self.setErrorText(index, errorMessages);
          } else {
            self.clearError(index);
          }
        }
      });
      this.trigger("checkrules");
    }
  },
  setErrorText: function(index, text) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find(this.errMessageContainer).text(text);
    wrapperObj.find(this.errMessageContainer).show();
    wrapperObj.find(this.errMessageContainer).addClass(this.errorClassName);
    wrapperObj.find("input,textarea,select").addClass(this.errorClassName);
  },
  contentChanged: function(e) {
    var target = $(e.currentTarget);
    var changedValue = target.val();
    var self = this;
    this.dumpContent();
    // this.getTopView().trigger('change:field');
    // var val = this.value();
    // if (this.model.validate(changedValue) === true) {
    //   var val = this.value();
    //   this.options.formView.setInputValue(self.model.getFieldId(), val);
    //   // self.model.set('value', val[self.model.get("_id")]);
    // }
  },


  addRules: function() {
    // this.addValidationRules();
    // this.addSpecialRules();
  },

  isRequired: function() {
    return this.model.isRequired();
  },

  addValidationRules: function() {
    if (this.model.get('IsRequired') === '1') {
      this.$el.find('#' + this.model.get('ID')).rules('add', {
        "required": true
      });
    }
  },

  addSpecialRules: function() {
    var self = this;

    var rules = {
      'Show': function(rulePasses, params) {
        var fieldId = 'Field' + params.Setting.FieldName;
        if (rulePasses) {
          App.views.form.showField(fieldId);
        } else {
          App.views.form.hideField(fieldId);
        }
      },
      'Hide': function(rulePasses, params) {
        var fieldId = 'Field' + params.Setting.FieldName;
        if (rulePasses) {
          App.views.form.hideField(fieldId);
        } else {
          App.views.form.showField(fieldId);
        }
      }
    };

    // also apply any special rules
    _(this.model.get('Rules') || []).each(function(rule) {
      var ruleConfig = _.clone(rule);
      ruleConfig.pageView = self.options.parentView;
      ruleConfig.fn = rules[rule.Type];
      self.$el.find('#' + self.model.get('ID')).wufoo_rules('add', ruleConfig);
    });
  },

  removeRules: function() {
    this.$el.find('#' + this.model.get('ID')).rules('remove');
  },

  // force a hide , defaults to false
  hide: function(force) {
    if (force || this.$el.is(':visible')) {
      this.$el.hide();
    }
  },
  renderButton: function(index, label, extension_type) {
    var button = $('<button>');
    button.addClass('fh_appform_special_button fh_appform_button_action');
    button.addClass(extension_type);
    button.attr("data-index", index);
    button.text(' ' + label);
    var img = $('<img>');
    img.attr('src', './img/' + extension_type + '.png');
    img.css('height', '28px');
    img.css('width', '28px');
    button.prepend(img);
    return this.htmlFromjQuery(button);
  },
  //deprecated
  addButton: function(input, extension_type, label) {
    var self = this;
    var button = $('<button>');
    button.addClass('fh_appform_special_button fh_appform_button_action');
    button.addClass(extension_type);
    button.text(' ' + label);
    var img = $('<img>');
    img.attr('src', './img/' + extension_type + '.png');
    img.css('height', '28px');
    img.css('width', '28px');
    button.prepend(img);

    button.click(function(e) {
      self.action(this);
      e.preventDefault();
      return false;
    });

    input.append(button);
    return button;
  },

  show: function() {
    if (!this.$el.is(':visible')) {
      this.$el.show();
      // add rules too
      //this.addRules();
      //set the form value from model
      //this.value(this.model.serialize());
    }
  },

  defaultValue: function() {
    var defaultValue = {};
    defaultValue[this.model.get('_id')] = this.model.get('DefaultVal');
    return defaultValue;
  },
  htmlFromjQuery: function(jqObj) {
    return $('<div>').append(jqObj.clone()).html();
  },
  // Gets or Set the value for this field
  // set value should be an array which contains repeated value for this field.
  value: function(value) {
    var self = this;
    if (value && !_.isEmpty(value)) {
      this.valuePopulate(value);
    }
    return this.getValue();
  },
  getValue: function() {
    var value = [];
    var repeatNum = this.curRepeat;
    for (var i = 0; i < repeatNum; i++) {
      value[i] = this.valueFromElement(i);
    }
    return value;
  },
  valueFromElement: function(index) {
    var wrapperObj = this.getWrapper(index);
    return wrapperObj.find("input,select,textarea").val() || "";
  },
  valuePopulate: function(value) {
    var number = value.length;
    while (number > this.curRepeat) {
      this.addElement();
    }

    for (var i = 0; i < value.length; i++) {
      var v = value[i];
      this.valuePopulateToElement(i, v);
    }
  },
  valuePopulateToElement: function(index, value) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find("input,select,textarea").val(value);
  },
  getWrapper: function(index) {
    var fieldId = this.model.getFieldId();
    return this.$fieldWrapper.find("#wrapper_" + fieldId + "_" + index);
  },
  fillArray: function(array, filler) {
    for (var i = 0; i < array.length; i++) {
      if (!array[i]) {
        array[i] = filler;
      }
    }
  },

  clearError: function(index) {
    var wrapperObj = this.getWrapper(index);
    wrapperObj.find(this.errMessageContainer).hide();
    wrapperObj.find("." + this.errorClassName).removeClass(this.errorClassName);
  }

});