import {
  Icon,
  Modal,
  ResourceItem,
  ResourceList,
  Text,
  TextField
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { SearchMinor } from "@shopify/polaris-icons";

export function CustomPicker({
  next,
  open,
  loading,
  title,
  searchQueryPlaceholder,
  searchQuery,
  onSearch,
  items,
  initialSelectedItems,
  primaryActionLabel,
  secondaryActionLabel,
  onCancel,
  onSelect,
  handleScrollBottom,
}) {
  const [selectedItemsIds, setSelectedItemsIds] = useState(initialSelectedItems.map((item) => item.id));
  // const [selectedItemsIds, setSelectedItemsIds] = useState([
  //   ...initialSelectedItems,
  // ]);
  console.log("initialSelectedItems inside custom picker.....", initialSelectedItems);
  console.log("selectedItemsIds inside custom picker.....", selectedItemsIds);

  function closePicker() {
    // setSelectedItemsIds(initialSelectedItems);
    onCancel();
  }

  return (
    <Modal
      open={open}
      onClose={closePicker}
      title={title}
      primaryAction={{
        content: primaryActionLabel,
        onAction: () => {
          onSelect(items.filter((item) => selectedItemsIds.includes(item.id)));
        },
      }}
      secondaryActions={[
        {
          content: secondaryActionLabel,
          onAction: closePicker,
        },
      ]}
      onScrolledToBottom={handleScrollBottom}
    >
      <Modal.Section>
        <TextField
          autoFocus={true}
          label=""
          type="text"
          placeholder={searchQueryPlaceholder}
          value={searchQuery}
          onChange={(value) => {
            console.log("value...", value);
            onSearch(value);
          }}
          prefix={<Icon source={SearchMinor} />}
          autoComplete="off"
        />
      </Modal.Section>
      <div
        style={{
          height: "400px",
          display: !loading && items.length === 0 ? "none" : "block",
        }}
      >
        <ResourceList
          selectable
          showHeader={false}
          loading={loading}
          items={items}
          renderItem={renderItem}
          selectedItems={selectedItemsIds}
          onSelectionChange={(selectedItemIds) => {
            console.log("selectedItemIds.....xxx", selectedItemIds);
            setSelectedItemsIds(selectedItemIds);
          }}
          resolveItemId={resolveItemIds}
        />
      </div>
      <div
        style={{
          height: "150px",
          display: !loading && items.length === 0 ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text variant="bodyMd" as="span" color="subdued">
          No items to show
        </Text>
      </div>
    </Modal>
  );

  function renderItem(item, _, index) {
    const { id, name, firstName, lastName, first_name, last_name, email } =
      item;

    return (
      <ResourceItem
        id={id}
        sortOrder={index}
        onClick={() => {
          if (selectedItemsIds.includes(id)) {
            setSelectedItemsIds(
              selectedItemsIds.filter((itemId) => itemId !== id)
            );
          } else {
            const newSelectedItemIds = [...selectedItemsIds, id];
            setSelectedItemsIds(newSelectedItemIds);
          }
        }}
      >
        <Text variant="bodyMd" as="p">
          {name
            ? name
            : first_name && last_name
            ? first_name + " " + last_name
            : firstName && lastName
            ? firstName + " " + lastName
            : ""}
        </Text>
        {/* <Text variant="bodyMd" as="span" color="subdued">{email ? email : "johndoe@gmail.com" }</Text> */}
      </ResourceItem>
    );
  }

  function resolveItemIds({ id }) {
    return id;
  }
}
