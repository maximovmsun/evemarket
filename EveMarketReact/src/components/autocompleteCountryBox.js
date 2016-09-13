var AutocompleteCountryBox = React.createClass({
    render: function () {
        return (
            <Autocomplete
                value={this.state.value}
                inputProps={{ name: "US state", id: "states-autocomplete" }}
                items={getStates() }
                getItemValue={function (item) { return item.name; } }
                onChange={this.onChange}
                onSelect={this.onSelect}
                shouldItemRender={matchStateToTerm}
                renderItem={
                    function (item, isHighlighted) {
                        return (
                            <div key={item.abbr}>{item.name}</div>
                        );
                    }
                }
                />
        );
    },
    getInitialState: function () {
        return {
            value: '',
            value2: ''
        }
    },
    onChange: function (event, value) {
        this.setState({ value: value });
    },
    onSelect: function (value) {
        this.setState({ value: value });
    }
});

module.exports = AutocompleteCountryBox;