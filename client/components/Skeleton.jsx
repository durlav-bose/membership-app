import {
  SkeletonPage,
  Layout,
  Card,
  SkeletonBodyText,
  TextContainer,
  SkeletonDisplayText,
} from '@shopify/polaris';
import React from 'react';
import "../pages/style.css";

const SkeletonExample = ({ num }) => {
  return (
    <SkeletonPage>
      <Layout>
      {
        Array.apply(null, { length: num ? num : 3 }).map((e, i) => (
          <Layout.Section key={i}>
            <Card sectioned>
              <TextContainer>
                {/* <SkeletonDisplayText size="small" /> */}
                <SkeletonBodyText lines={2} />
              </TextContainer>
            </Card>
          </Layout.Section>
        ))
      }
      </Layout>
    </SkeletonPage>
  );
}

export default SkeletonExample;