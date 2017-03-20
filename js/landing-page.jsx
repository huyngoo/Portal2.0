import React from 'react';
import ReactDOM from 'react-dom';
import Autosuggest from 'react-autosuggest';

var workflowSuggestions = [];
var workflowURI = "../html/workflow-main.html";

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestions(value) {
  function removeDuplicates(value, index, self) { 
    return self.indexOf(value) === index;
  }
    
  const escapedValue = escapeRegexCharacters(value.trim());
  
  if (escapedValue === '') {
    return [];
  }

  // This regex returns suggestions where the input is found matching the beginning of the suggestion
  const regexBeginningString = new RegExp('^' + escapedValue, 'i');
  // This regex returns suggestions where the input is found anywhere in the suggestion
  const regexAllString = new RegExp(escapedValue, 'i');
    
  var beginningSuggestions = workflowSuggestions.filter(workflowLabel => regexBeginningString.test(workflowLabel.label));
  var allSuggestions = workflowSuggestions.filter(workflowLabel => regexAllString.test(workflowLabel.label));
  var suggestions = beginningSuggestions.concat(allSuggestions);
  return suggestions.filter(removeDuplicates);
}

function getSuggestionValue(suggestion) {
  return suggestion.label;
}

function renderSuggestion(suggestion) {
  return (
    <span>{suggestion.label}</span>
  );
}

/**
* Method for parsing the names and URIs of the templates			 
*/
function parseAutocompleteData(res) {
  if(res.results && res.results.bindings) {
    var bindings = res.results.bindings;
    for(var i =0; i < bindings.length; i++) {
      var binding = bindings[i];
      if(binding.label && binding.wf) {
        if(binding.wf.value.toLowerCase().indexOf("list_of") == -1) {
          var label = binding.label.value;
          label = label.replace(/\-d.*/g,"");
          if(label.toLowerCase().indexOf(".jpg") == -1 && 
             label.toLowerCase().indexOf(".png") == -1 &&
             label.toLowerCase().indexOf(".gif") == -1) {
               var newElement = {label:label, uri:binding.wf.value};
               workflowSuggestions.push(newElement);
          }
        }
      }
    }
  }
}

class SearchBar extends React.Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: [],
      noSuggestions: false
    };    
    this.onChange = this.onChange.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
  }
    
  componentDidMount() {
      // call function to execute ajax call from query.js, passing into it, a function that takes in an input "res" which we define to execute when the ajax call returns successfully
      populateSearchBar(function(res) { 
          //executes after ajax call returns
          parseAutocompleteData(res);
      });
  }

  onChange(event, { newValue, method }) {
    this.setState({
      value: newValue
    });
  };
  
  onSuggestionsFetchRequested({ value }) {
    const suggestions = getSuggestions(value);
    const isInputBlank = value.trim() === '';
    const noSuggestions = !isInputBlank && suggestions.length === 0;
    this.setState({
      suggestions,
      noSuggestions
    });
  };

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: []
    });
  };
    
  onSuggestionSelected(event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) {
      localStorage.setItem("workflow-uri", suggestion.uri);
      localStorage.setItem("workflow-suggestions", JSON.stringify(workflowSuggestions));
      window.location = "../html/workflow-main.html";
  };

  render() {
    const { value, suggestions, noSuggestions } = this.state;
    const inputProps = {
      placeholder: "Search for Workflows",
      value,
      onChange: this.onChange
    };
    return (
      <div>
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          inputProps={inputProps} />
        {
          noSuggestions &&
            <div className="no-suggestions">
              No suggestions
            </div>
        }
      </div>
    );
  }
}

ReactDOM.render(<SearchBar />, document.getElementById('search-bar'));
